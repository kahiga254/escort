package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(route *gin.Engine) {

	// Public routes (no authentication required)
	route.GET("/users", controllers.GetAllActiveUsers)
	auth := route.Group("/auth")

	{
		auth.POST("/login", controllers.LoginUser)
		auth.POST("/register", controllers.RegisterUser)
	}
}
