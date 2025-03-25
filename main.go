package main

import (
	"escort/database"
	"escort/routes"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("🚀 Starting server...")

	godotenv.Load()
	database.ConnectDB()
	router := gin.Default()
	

	routes.AuthRoutes(router)
	routes.AdminRoutes(router)

	log.Fatal(http.ListenAndServe(":8080", router))
}