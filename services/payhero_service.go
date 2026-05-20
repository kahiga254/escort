package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type PayHeroClient struct {
	APIBaseURL  string
	AuthToken   string
	ChannelID   int
	CallbackURL string
	httpClient  *http.Client
}

type STKPushRequest struct {
	Amount            int    `json:"amount"`
	PhoneNumber       string `json:"phone_number"`
	ChannelID         int    `json:"channel_id"`
	Provider          string `json:"provider"`
	ExternalReference string `json:"external_reference,omitempty"`
	CustomerName      string `json:"customer_name,omitempty"`
	CallbackURL       string `json:"callback_url,omitempty"`
}

type STKPushResponse struct {
	Success           bool   `json:"success"`
	Status            string `json:"status"`
	Reference         string `json:"reference"`
	CheckoutRequestID string `json:"CheckoutRequestID"`
}

type PaymentChannel struct {
	ID          int    `json:"id"`
	ShortCode   string `json:"short_code"`
	Description string `json:"description"`
	ChannelType string `json:"channel_type"`
	IsActive    bool   `json:"is_active"`
}

func NewPayHeroClient() *PayHeroClient {
	// Get channel ID as int from env
	channelID := 8385 // Using your till channel ID from the curl response
	if id := os.Getenv("PAYHERO_CHANNEL_ID"); id != "" {
		fmt.Sscanf(id, "%d", &channelID)
	}

	return &PayHeroClient{
		APIBaseURL:  getEnv("PAYHERO_API_URL", "https://backend.payhero.co.ke"),
		AuthToken:   os.Getenv("PAYHERO_AUTH_TOKEN"),
		ChannelID:   channelID,
		CallbackURL: os.Getenv("PAYHERO_CALLBACK_URL"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// SendSTKPush initiates an M-Pesa payment request
func (c *PayHeroClient) SendSTKPush(amount int, phone string, externalRef string) (*STKPushResponse, error) {
	url := fmt.Sprintf("%s/api/v2/payments", c.APIBaseURL)

	// Format phone number (remove 254 prefix and add 0)
	formattedPhone := formatPhoneNumber(phone)

	reqBody := STKPushRequest{
		Amount:            amount,
		PhoneNumber:       formattedPhone,
		ChannelID:         c.ChannelID,
		Provider:          "m-pesa",
		ExternalReference: externalRef,
		CallbackURL:       c.CallbackURL,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	fmt.Printf("📤 Sending to: %s\n", url)
	fmt.Printf("📦 Body: %s\n", string(jsonData))

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// IMPORTANT: The auth header must be exactly as shown in the curl test
	httpReq.Header.Set("Authorization", "Basic "+c.AuthToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	fmt.Printf("📥 Status: %d\n", resp.StatusCode)
	fmt.Printf("📄 Response: %s\n", string(body))

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var stkResp STKPushResponse
	if err := json.Unmarshal(body, &stkResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &stkResp, nil
}

// formatPhoneNumber converts phone to format expected by PayHero
/*func formatPhoneNumber(phone string) string {
	// Remove any '+' or spaces
	phone = strings.ReplaceAll(phone, "+", "")
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	// If it starts with 254, replace with 0
	if strings.HasPrefix(phone, "254") {
		phone = "0" + phone[3:]
	}

	// Ensure it starts with 0
	if !strings.HasPrefix(phone, "0") {
		phone = "0" + phone
	}

	return phone
}*/

// GetPaymentChannels - useful for debugging
func (c *PayHeroClient) GetPaymentChannels() ([]PaymentChannel, error) {
	url := fmt.Sprintf("%s/api/v2/payment_channels", c.APIBaseURL)

	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Basic "+c.AuthToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		PaymentChannels []PaymentChannel `json:"payment_channels"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result.PaymentChannels, nil
}
