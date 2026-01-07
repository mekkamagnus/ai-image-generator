package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// RegisterQwenEndpoints registers the Qwen image generation proxy endpoints
func RegisterQwenEndpoints(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// POST /api/qwen/generate - Create image generation task
		e.Router.POST("/api/qwen/generate", func(c echo.Context) error {
			// Parse request body
			var req struct {
				Prompt        string `json:"prompt"`
				Size          string `json:"size"`
				PromptExtend  bool   `json:"prompt_extend"`
				Watermark     bool   `json:"watermark"`
			}

			if err := c.Bind(&req); err != nil {
				return c.JSON(400, map[string]string{"error": "Invalid request body"})
			}

			if req.Prompt == "" {
				return c.JSON(400, map[string]string{"error": "Prompt is required"})
			}

			// Set defaults
			if req.Size == "" {
				req.Size = "1328*1328"
			}

			// Get DashScope configuration from environment
			apiKey := os.Getenv("DASHSCOPE_API_KEY")
			region := os.Getenv("DASHSCOPE_REGION")

			if apiKey == "" {
				return c.JSON(500, map[string]string{"error": "DASHSCOPE_API_KEY not configured"})
			}

			// Determine base URL based on region
			baseURL := "https://dashscope.aliyuncs.com/api/v1"
			if region == "singapore" {
				baseURL = "https://dashscope-intl.aliyuncs.com/api/v1"
			}

			// Build DashScope API request
			dashscopeReq := map[string]interface{}{
				"model": "qwen-image-plus",
				"input": map[string]interface{}{
					"messages": []map[string]interface{}{
						{
							"role": "user",
							"content": []map[string]string{
								{"text": req.Prompt},
							},
						},
					},
				},
				"parameters": map[string]interface{}{
					"size":          req.Size,
					"prompt_extend": req.PromptExtend,
					"watermark":     req.Watermark,
				},
			}

			reqBody, err := json.Marshal(dashscopeReq)
			if err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to marshal request"})
			}

			// Create HTTP request to DashScope
			url := baseURL + "/services/aigc/multimodal-generation/generation"
			httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
			if err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to create request"})
			}

			// Set headers
			httpReq.Header.Set("Content-Type", "application/json")
			httpReq.Header.Set("Authorization", "Bearer "+apiKey)
			httpReq.Header.Set("X-DashScope-Async", "enable")

			// Execute request
			client := &http.Client{}
			resp, err := client.Do(httpReq)
			if err != nil {
				log.Printf("DashScope API error: %v", err)
				return c.JSON(500, map[string]string{"error": "Failed to call DashScope API"})
			}
			defer resp.Body.Close()

			// Read response
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to read response"})
			}

			// Parse DashScope response
			var dashscopeResp map[string]interface{}
			if err := json.Unmarshal(body, &dashscopeResp); err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to parse response"})
			}

			// Return appropriate status code
			statusCode := resp.StatusCode
			if statusCode >= 400 {
				return c.JSON(statusCode, dashscopeResp)
			}

			return c.JSON(200, dashscopeResp)
		})

		// GET /api/qwen/task/:taskId - Query task status
		e.Router.GET("/api/qwen/task/:taskId", func(c echo.Context) error {
			taskId := c.Param("taskId")

			if taskId == "" {
				return c.JSON(400, map[string]string{"error": "Task ID is required"})
			}

			// Get DashScope configuration from environment
			apiKey := os.Getenv("DASHSCOPE_API_KEY")
			region := os.Getenv("DASHSCOPE_REGION")

			if apiKey == "" {
				return c.JSON(500, map[string]string{"error": "DASHSCOPE_API_KEY not configured"})
			}

			// Determine base URL based on region
			baseURL := "https://dashscope.aliyuncs.com/api/v1"
			if region == "singapore" {
				baseURL = "https://dashscope-intl.aliyuncs.com/api/v1"
			}

			// Create HTTP request to DashScope
			url := fmt.Sprintf("%s/tasks/%s", baseURL, taskId)
			httpReq, err := http.NewRequest("GET", url, nil)
			if err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to create request"})
			}

			// Set headers
			httpReq.Header.Set("Authorization", "Bearer "+apiKey)

			// Execute request
			client := &http.Client{}
			resp, err := client.Do(httpReq)
			if err != nil {
				log.Printf("DashScope API error: %v", err)
				return c.JSON(500, map[string]string{"error": "Failed to call DashScope API"})
			}
			defer resp.Body.Close()

			// Read response
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to read response"})
			}

			// Parse DashScope response
			var dashscopeResp map[string]interface{}
			if err := json.Unmarshal(body, &dashscopeResp); err != nil {
				return c.JSON(500, map[string]string{"error": "Failed to parse response"})
			}

			// Return appropriate status code
			statusCode := resp.StatusCode
			if statusCode >= 400 {
				return c.JSON(statusCode, dashscopeResp)
			}

			return c.JSON(200, dashscopeResp)
		})

		return nil
	})
}
