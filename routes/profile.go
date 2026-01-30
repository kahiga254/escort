package routes

import (
	"escort/admin"
	"escort/middleware"

	"github.com/gin-gonic/gin"
)

func AdminRoutes(route *gin.Engine) {
	adminGroup := route.Group("/admin").Use(middleware.RequireAdmin())

	{
		// User Management
		adminGroup.GET("/users", admin.GetAllUsers)
		adminGroup.GET("/users/:id", admin.GetUserByID)
		adminGroup.PUT("/approve/:id", admin.ApproveUser)
		adminGroup.PUT("/users/:id/status", admin.ToggleUserStatus)
		adminGroup.DELETE("/users/:id", admin.DeleteUser)

		// Dashboard Statistics
		adminGroup.GET("/stats", admin.GetDashboardStats)

		// Subscription Management
		adminGroup.GET("/subscriptions", admin.GetAllSubscriptions)
		adminGroup.PUT("/subscriptions/:id", admin.UpdateSubscription)

		// Reports
		adminGroup.GET("/reports/users", admin.GetUserReport)
		adminGroup.GET("/reports/subscriptions", admin.GetSubscriptionReport)
	}
}
