package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
)

func TelegramRoutes(route *gin.Engine) {
	telegramGroup := route.Group("/api/telegram")

	{
		// Get next unadvertised creator
		telegramGroup.GET("/creators/next-unadvertised", controllers.GetNextUnadvertisedCreator)

		// Mark creator as advertised
		telegramGroup.POST("/creators/:id/mark-advertised", controllers.MarkCreatorAdvertised)
	}
}