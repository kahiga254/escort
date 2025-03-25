package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName string             `bson:"first_name" json:"first_name" binding:"required"`
	LastName  string             `bson:"last_name" json:"last_name" binding:"required"`
	PhoneNo   string             `bson:"phone_no" json:"phone_no" binding:"required"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	Password  string             `bson:"password" json:"password" binding:"required"`
	Location  string             `bson:"location" json:"location" binding:"required"`
	Services []string           `bson:"services" json:"services"`
	Price	 float64            `bson:"price" json:"price"`
	ImageUrl string             `bson:"image_url" json:"image_url"`
	IsActive  bool               `bson:"is_active" json:"is_active"`
	Role      string 		   `bson:"role" json:"role"` // "user" or "admin"
}