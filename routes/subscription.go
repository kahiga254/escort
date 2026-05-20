package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
)

/*func SubscriptionRoutes(router *gin.Engine, subscriptionController *controllers.SubscriptionController) {
	// Protected route (requires authentication)
	api := router.Group("/api")
	{
		api.POST("/subscribe", subscriptionController.InitiateSubscription)
	}
}*/

// Testing the route
func SubscriptionRoutes(router *gin.Engine, subscriptionController *controllers.SubscriptionController) {
	// Public test endpoint (no auth required for testing)
	router.GET("/api/payhero-test", subscriptionController.TestPayHeroConnection)

	// Protected route (requires authentication)
	api := router.Group("/api")
	{
		api.POST("/subscribe", subscriptionController.InitiateSubscription)
	}
}
