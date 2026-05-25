package routes

import (
	"escort/controllers"

	"github.com/gin-gonic/gin"
)

func BlogRoutes(router *gin.Engine) {
	blogRoutes := router.Group("/api/blogs")
	{
		blogRoutes.POST("", controllers.CreateBlog)
		blogRoutes.GET("", controllers.GetAllBlogs)
		blogRoutes.GET("/:slug", controllers.GetBlogBySlug)
		blogRoutes.PUT("/:id", controllers.UpdateBlog)
		blogRoutes.DELETE("/:id", controllers.DeleteBlog)
	}
}
