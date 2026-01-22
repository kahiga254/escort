package routes

import (
	"context"
	"escort/controllers"
	"escort/database"
	"escort/middleware"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func AuthRoutes(route *gin.Engine) {

	// Public routes (no authentication required)

	// GET /users
	route.GET("/users", controllers.GetAllActiveUsers)

	// GET /search?q=nairobi
	route.GET("/search", controllers.SearchUsers)

	// GET /location/nairobi
	route.GET("location/:location", controllers.GetUsersByLocation)

	//Get Subscription Plans
	route.GET("/subscription/plans", controllers.GetSubscriptionPlans)

	//MPESA CALLBACK Webhook
	route.POST("/mpesa/callback", controllers.MpesaCallback)

	auth := route.Group("/auth")

	{
		auth.POST("/login", controllers.LoginUser)
		auth.POST("/register", controllers.RegisterUser)

		auth.GET("/debug/subscriptions", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			// Get all subscriptions
			cursor, err := database.SubscriptionCollection.Find(ctx, bson.M{})
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to query: " + err.Error()})
				return
			}
			defer cursor.Close(ctx)

			var results []map[string]interface{}
			for cursor.Next(ctx) {
				var sub map[string]interface{}
				if err := cursor.Decode(&sub); err != nil {
					continue
				}
				results = append(results, sub)
			}

			c.JSON(200, gin.H{
				"count":         len(results),
				"subscriptions": results,
			})
		})

		// ====== SUBSCRIPTION ROUTES ======
		protected := auth.Group("").Use(middleware.RequireAuth())
		// 1. subscribe - Initiate MPESA payment
		protected.POST("/subscribe", controllers.Subscribe)

		//2. Check User's subscription status
		protected.GET("/subscription/check-status", controllers.CheckSubscriptionStatus)

		//3. Check user's current subscription status
		protected.GET("/subscription/status", controllers.GetUserSubscriptionStatus)
	}
}
