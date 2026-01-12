package routes

import (
	"escort/admin"
	"escort/middleware"

	"github.com/gin-gonic/gin"
)

func AdminRoutes(route *gin.Engine) {
	adminGroup := route.Group("/admin").Use(middleware.RequireAdmin)

	{
		adminGroup.PUT("/approve/:id", admin.ApproveUser)
		adminGroup.DELETE("/delete/:id", admin.DeleteUser)
	}

	//Public route to get all approved users

}
