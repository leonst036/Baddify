package docker

import (
	"context"
	"io"
	"os"

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
