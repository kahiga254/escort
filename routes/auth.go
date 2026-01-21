package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
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

		// ====== SUBSCRIPTION ROUTES ======

		// 1. subscribe - Initiate MPESA payment
		auth.POST("/subscribe", controllers.Subscribe)

		//2. Check User's subscription status
		auth.GET("/subscription/check-status", controllers.CheckSubscriptionStatus)

		//3. Check user's current subscription status
		auth.GET("/subscription/status", controllers.GetUserSubscriptionStatus)
	}
}
