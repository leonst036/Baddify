package caddy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Router struct {
	adminURL string
}

func NewRouter(adminURL string) *Router {
	if adminURL == "" {
		adminURL = "http://127.0.0.1:2019"
	}
	return &Router{adminURL: adminURL}
}

// ensureServer guarantees the HTTP server 'srv0' exists
func (r *Router) ensureServer() error {
	resp, err := http.Get(fmt.Sprintf("%s/config/apps/http/servers/srv0", r.adminURL))
	if err == nil && resp.StatusCode == http.StatusOK {
		resp.Body.Close()
		return nil
	}
	if resp != nil {
		resp.Body.Close()
	}

	serverConfig := map[string]any{
		"servers": map[string]any{
			"srv0": map[string]any{
				"listen": []string{":80"},
				"routes": []any{},
			},
		},
	}
	body, err := json.Marshal(serverConfig)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/config/apps/http", r.adminURL), bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("failed to init caddy http server: status %d", resp.StatusCode)
	}
	return nil
}

func (r *Router) SetRoute(domain string, targetPort string) error {
	if err := r.ensureServer(); err != nil {
		return err
	}

	// Remove existing route if any
	delReq, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/id/%s", r.adminURL, domain), nil)
	if delResp, err := http.DefaultClient.Do(delReq); err == nil {
		delResp.Body.Close()
	}

	routeConfig := map[string]any{
		"@id": domain,
		"match": []map[string]any{
			{"host": []string{domain}},
		},
		"handle": []map[string]any{
			{
				"handler": "reverse_proxy",
				"upstreams": []map[string]any{
					{"dial": fmt.Sprintf("127.0.0.1:%s", targetPort)},
				},
			},
		},
	}

	body, err := json.Marshal(routeConfig)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/config/apps/http/servers/srv0/routes", r.adminURL)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("caddy API Error: Status %d", resp.StatusCode)
	}
	return nil
}
