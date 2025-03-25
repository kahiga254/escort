package routes

import (
	"github.com/gin-gonic/gin"
	"escort/controllers"
)

func AuthRoutes(route *gin.Engine) {
	auth := route.Group("/auth")

	{
	auth.POST("/login", controllers.LoginUser)
	auth.POST("/register", controllers.RegisterUser)
	}
}