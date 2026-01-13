package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(route *gin.Engine) {

	// Public routes (no authentication required)

	// GET /plumbers
	route.GET("/users", controllers.GetAllActiveUsers)

	// GET /plumbers/search?q=nairobi
	route.GET("/search", controllers.SearchUsers)

	// GET /plumbers/location/nairobi
	route.GET("location/:location", controllers.GetUsersByLocation)

	auth := route.Group("/auth")

	{
		auth.POST("/login", controllers.LoginUser)
		auth.POST("/register", controllers.RegisterUser)
	}
}
