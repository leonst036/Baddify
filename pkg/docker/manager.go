package docker

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/distribution/reference"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

type Manager struct {
	cli *client.Client
}

func NewManager() (*Manager, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &Manager{cli: cli}, nil
}

// ImageExists checks whether an image exists locally or in a remote registry.
func (m *Manager) ImageExists(ctx context.Context, imgName string) (bool, string, error) {
	if m == nil || m.cli == nil {
		return false, "", fmt.Errorf("docker client is not initialized")
	}

	named, err := reference.ParseNormalizedNamed(imgName)
	if err != nil {
		return false, "", err
	}
	tagged := reference.TagNameOnly(named).String()

	// Check local images
	if _, _, err := m.cli.ImageInspectWithRaw(ctx, tagged); err == nil {
		return true, "local", nil
	}
	if imgName != tagged {
		if _, _, err := m.cli.ImageInspectWithRaw(ctx, imgName); err == nil {
			return true, "local", nil
		}
	}

	// Check remote registry
	if _, err := m.cli.DistributionInspect(ctx, tagged, ""); err == nil {
		return true, "remote", nil
	} else if ctx.Err() != nil {
		return false, "", ctx.Err()
	} else if client.IsErrConnectionFailed(err) {
		return false, "", err
	}

	return false, "", nil
}

func (m *Manager) PullImage(ctx context.Context, imgName string) error {
	reader, err := m.cli.ImagePull(ctx, imgName, image.PullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	_, err = io.Copy(os.Stdout, reader) // print logs in terminal
	return err
}

// RunContainer starts a container and maps a port to the host
func (m *Manager) RunContainer(ctx context.Context, imgName, containerName, hostPort, containerPort string) (string, error) {
	cPort := nat.Port(containerPort + "/tcp")
	portMap := nat.PortMap{
		cPort: []nat.PortBinding{{HostIP: "127.0.0.1", HostPort: hostPort}},
	}

	resp, err := m.cli.ContainerCreate(ctx,
		&container.Config{
			Image:        imgName,
			ExposedPorts: nat.PortSet{cPort: struct{}{}},
		},
		&container.HostConfig{
			PortBindings:  portMap,
			RestartPolicy: container.RestartPolicy{Name: "unless-stopped"},
		},
		nil, nil, containerName,
	)
	if err != nil {
		return "", err
	}

	err = m.cli.ContainerStart(ctx, resp.ID, container.StartOptions{})
	return resp.ID, err
}

// GetContainerCounts returns the count of running and total containers.
func (m *Manager) GetContainerCounts(ctx context.Context) (int, int, error) {
	containers, err := m.cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return 0, 0, err
	}
	running := 0
	for _, c := range containers {
		if c.State == "running" {
			running++
		}
	}
	return running, len(containers), nil
}

type ContainerPort struct {
	IP          string `json:"ip,omitempty"`
	PrivatePort uint16 `json:"private_port"`
	PublicPort  uint16 `json:"public_port,omitempty"`
	Type        string `json:"type"`
}

type ContainerItem struct {
	ID      string          `json:"id"`
	ShortID string          `json:"short_id"`
	Name    string          `json:"name"`
	Image   string          `json:"image"`
	State   string          `json:"state"`
	Status  string          `json:"status"`
	Created int64           `json:"created"`
	Ports   []ContainerPort `json:"ports"`
}

// GetContainers returns a list of containers on the host.
func (m *Manager) GetContainers(ctx context.Context) ([]ContainerItem, error) {
	containers, err := m.cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}

	items := make([]ContainerItem, 0, len(containers))
	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = c.Names[0]
			if len(name) > 0 && name[0] == '/' {
				name = name[1:]
			}
		}
		shortID := c.ID
		if len(shortID) > 12 {
			shortID = shortID[:12]
		}

		ports := make([]ContainerPort, 0, len(c.Ports))
		for _, p := range c.Ports {
			ports = append(ports, ContainerPort{
				IP:          p.IP,
				PrivatePort: p.PrivatePort,
				PublicPort:  p.PublicPort,
				Type:        p.Type,
			})
		}

		items = append(items, ContainerItem{
			ID:      c.ID,
			ShortID: shortID,
			Name:    name,
			Image:   c.Image,
			State:   c.State,
			Status:  c.Status,
			Created: c.Created,
			Ports:   ports,
		})
	}
	return items, nil
}

func (m *Manager) StartContainer(ctx context.Context, id string) error {
	return m.cli.ContainerStart(ctx, id, container.StartOptions{})
}

func (m *Manager) StopContainer(ctx context.Context, id string) error {
	return m.cli.ContainerStop(ctx, id, container.StopOptions{})
}

func (m *Manager) RestartContainer(ctx context.Context, id string) error {
	return m.cli.ContainerRestart(ctx, id, container.StopOptions{})
}

type DockerInfo struct {
	Version       string `json:"version"`
	APIVersion    string `json:"api_version"`
	OS            string `json:"os"`
	Arch          string `json:"arch"`
	KernelVersion string `json:"kernel_version"`
}

func (m *Manager) GetDockerInfo(ctx context.Context) (*DockerInfo, error) {
	ver, err := m.cli.ServerVersion(ctx)
	if err != nil {
		return nil, err
	}
	return &DockerInfo{
		Version:       ver.Version,
		APIVersion:    ver.APIVersion,
		OS:            ver.Os,
		Arch:          ver.Arch,
		KernelVersion: ver.KernelVersion,
	}, nil
}
