package database

import (
	"context"
	"errors"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists   = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrDeploymentNotFound = errors.New("deployment not found")
)

type User struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Username  string        `bson:"username" json:"username"`
	Password  string        `bson:"password" json:"-"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}

type Deployment struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Image         string        `bson:"image" json:"image"`
	ContainerName string        `bson:"container_name" json:"container_name"`
	HostPort      string        `bson:"host_port" json:"host_port"`
	InternalPort  string        `bson:"internal_port" json:"internal_port"`
	Domain        string        `bson:"domain" json:"domain"`
	ContainerID   string        `bson:"container_id,omitempty" json:"container_id,omitempty"`
	Status        string        `bson:"status" json:"status"`
	CreatedAt     time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time     `bson:"updated_at" json:"updated_at"`
}

type MongoManager struct {
	Client      *mongo.Client
	Database    *mongo.Database
	Users       *mongo.Collection
	Deployments *mongo.Collection
}

// NewMongoManager initializes MongoDB connection and collections
func NewMongoManager(uri, dbName string) (*MongoManager, error) {
	if uri == "" {
		uri = os.Getenv("MONGO_URI")
		if uri == "" {
			uri = "mongodb://admin:password123@localhost:27017"
		}
	}

	if dbName == "" {
		dbName = os.Getenv("MONGO_DB")
		if dbName == "" {
			dbName = "baddify"
		}
	}

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(ctx)
		return nil, err
	}

	db := client.Database(dbName)
	manager := &MongoManager{
		Client:      client,
		Database:    db,
		Users:       db.Collection("users"),
		Deployments: db.Collection("deployments"),
	}

	if err := manager.ensureIndexes(ctx); err != nil {
		_ = client.Disconnect(ctx)
		return nil, err
	}

	return manager, nil
}

func (m *MongoManager) ensureIndexes(ctx context.Context) error {
	userIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Users.Indexes().CreateOne(ctx, userIndex); err != nil {
		return err
	}

	deploymentIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "domain", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Deployments.Indexes().CreateOne(ctx, deploymentIndex); err != nil {
		return err
	}

	return nil
}

func (m *MongoManager) Disconnect(ctx context.Context) error {
	return m.Client.Disconnect(ctx)
}

func (m *MongoManager) Ping(ctx context.Context) error {
	return m.Client.Ping(ctx, nil)
}

func (m *MongoManager) Collection(name string) *mongo.Collection {
	return m.Database.Collection(name)
}

// User methods

func (m *MongoManager) RegisterUser(ctx context.Context, username, password string) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	user := &User{
		Username:  username,
		Password:  string(hashedPassword),
		CreatedAt: now,
		UpdatedAt: now,
	}

	res, err := m.Users.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrUserAlreadyExists
		}
		return nil, err
	}

	if oid, ok := res.InsertedID.(bson.ObjectID); ok {
		user.ID = oid
	}

	return user, nil
}

func (m *MongoManager) AuthenticateUser(ctx context.Context, username, password string) (*User, error) {
	user, err := m.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (m *MongoManager) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	err := m.Users.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (m *MongoManager) GetUserByID(ctx context.Context, id bson.ObjectID) (*User, error) {
	var user User
	err := m.Users.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Deployment methods

func (m *MongoManager) SaveDeployment(ctx context.Context, dep *Deployment) error {
	now := time.Now().UTC()
	dep.UpdatedAt = now

	if dep.ID.IsZero() {
		dep.CreatedAt = now
		res, err := m.Deployments.InsertOne(ctx, dep)
		if err != nil {
			return err
		}
		if oid, ok := res.InsertedID.(bson.ObjectID); ok {
			dep.ID = oid
		}
		return nil
	}

	update := bson.M{
		"$set": dep,
	}
	res, err := m.Deployments.UpdateByID(ctx, dep.ID, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrDeploymentNotFound
	}
	return nil
}

func (m *MongoManager) GetDeployments(ctx context.Context) ([]Deployment, error) {
	cursor, err := m.Deployments.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var deployments []Deployment
	if err := cursor.All(ctx, &deployments); err != nil {
		return nil, err
	}

	return deployments, nil
}

func (m *MongoManager) GetDeploymentByDomain(ctx context.Context, domain string) (*Deployment, error) {
	var dep Deployment
	err := m.Deployments.FindOne(ctx, bson.M{"domain": domain}).Decode(&dep)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrDeploymentNotFound
		}
		return nil, err
	}
	return &dep, nil
}

func (m *MongoManager) GetDeploymentByID(ctx context.Context, id bson.ObjectID) (*Deployment, error) {
	var dep Deployment
	err := m.Deployments.FindOne(ctx, bson.M{"_id": id}).Decode(&dep)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrDeploymentNotFound
		}
		return nil, err
	}
	return &dep, nil
}

func (m *MongoManager) DeleteDeployment(ctx context.Context, id bson.ObjectID) error {
	res, err := m.Deployments.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrDeploymentNotFound
	}
	return nil
}
