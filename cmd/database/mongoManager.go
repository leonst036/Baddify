package database

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound             = errors.New("user not found")
	ErrUserAlreadyExists        = errors.New("user already exists")
	ErrInvalidCredentials       = errors.New("invalid credentials")
	ErrDeploymentNotFound       = errors.New("deployment not found")
	ErrProjectNotFound          = errors.New("project not found")
	ErrProjectAlreadyExists     = errors.New("project already exists")
	ErrEnvironmentNotFound      = errors.New("environment not found")
	ErrEnvironmentAlreadyExists = errors.New("environment already exists")
)

type User struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UUID      string        `bson:"uuid" json:"uuid"`
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

type Project struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UUID        string        `bson:"uuid" json:"uuid"`
	UserUUID    string        `bson:"user_uuid" json:"user_uuid"`
	Name        string        `bson:"name" json:"name"`
	Description string        `bson:"description" json:"description"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}

type EnvVariable struct {
	Key      string `bson:"key" json:"key"`
	Value    string `bson:"value" json:"value"`
	IsSecret bool   `bson:"is_secret,omitempty" json:"isSecret,omitempty"`
}

type Environment struct {
	ID                bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UUID              string        `bson:"uuid" json:"uuid"`
	ProjectUUID       string        `bson:"project_uuid" json:"project_uuid"`
	Name              string        `bson:"name" json:"name"`
	Type              string        `bson:"type" json:"type"`
	Status            string        `bson:"status" json:"status"`
	Branch            string        `bson:"branch" json:"branch"`
	LastCommitHash    string        `bson:"last_commit_hash" json:"lastCommitHash"`
	LastCommitMessage string        `bson:"last_commit_message" json:"lastCommitMessage"`
	Description       string        `bson:"description" json:"description"`
	Variables         []EnvVariable `bson:"variables" json:"variables"`
	CreatedAt         time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt         time.Time     `bson:"updated_at" json:"updatedAt"`
}

type MongoManager struct {
	Client       *mongo.Client
	Database     *mongo.Database
	Users        *mongo.Collection
	Deployments  *mongo.Collection
	Projects     *mongo.Collection
	Environments *mongo.Collection
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
		Client:       client,
		Database:     db,
		Users:        db.Collection("users"),
		Deployments:  db.Collection("deployments"),
		Projects:     db.Collection("projects"),
		Environments: db.Collection("environments"),
	}

	if err := manager.ensureIndexes(ctx); err != nil {
		_ = client.Disconnect(ctx)
		return nil, err
	}

	return manager, nil
}

func (m *MongoManager) ensureIndexes(ctx context.Context) error {
	if err := m.EnsureUserUUIDs(ctx); err != nil {
		return err
	}

	userIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Users.Indexes().CreateOne(ctx, userIndex); err != nil {
		return err
	}

	userUUIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "uuid", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Users.Indexes().CreateOne(ctx, userUUIDIndex); err != nil {
		return err
	}

	deploymentIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "domain", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Deployments.Indexes().CreateOne(ctx, deploymentIndex); err != nil {
		return err
	}

	projectIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Projects.Indexes().CreateOne(ctx, projectIndex); err != nil {
		return err
	}

	if err := m.EnsureProjectUUIDs(ctx); err != nil {
		return err
	}

	projectUUIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "uuid", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Projects.Indexes().CreateOne(ctx, projectUUIDIndex); err != nil {
		return err
	}

	projectUserIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "user_uuid", Value: 1}},
	}
	if _, err := m.Projects.Indexes().CreateOne(ctx, projectUserIndex); err != nil {
		return err
	}

	if err := m.EnsureEnvironmentUUIDs(ctx); err != nil {
		return err
	}

	envUUIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "uuid", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Environments.Indexes().CreateOne(ctx, envUUIDIndex); err != nil {
		return err
	}

	envProjectIndex := mongo.IndexModel{
		Keys: bson.D{
			{Key: "project_uuid", Value: 1},
			{Key: "name", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}
	if _, err := m.Environments.Indexes().CreateOne(ctx, envProjectIndex); err != nil {
		return err
	}

	return nil
}

// EnsureProjectUUIDs migrates any projects missing a UUID by assigning a new unique UUID.
func (m *MongoManager) EnsureProjectUUIDs(ctx context.Context) error {
	filter := bson.M{
		"$or": []bson.M{
			{"uuid": bson.M{"$exists": false}},
			{"uuid": ""},
			{"uuid": nil},
		},
	}

	cursor, err := m.Projects.Find(ctx, filter)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var p Project
		if err := cursor.Decode(&p); err != nil {
			return err
		}

		newUUID := uuid.NewString()
		_, err := m.Projects.UpdateByID(ctx, p.ID, bson.M{
			"$set": bson.M{
				"uuid":       newUUID,
				"updated_at": time.Now().UTC(),
			},
		})
		if err != nil {
			return err
		}
	}

	return cursor.Err()
}

// EnsureEnvironmentUUIDs migrates any environments missing a UUID by assigning a new unique UUID.
func (m *MongoManager) EnsureEnvironmentUUIDs(ctx context.Context) error {
	filter := bson.M{
		"$or": []bson.M{
			{"uuid": bson.M{"$exists": false}},
			{"uuid": ""},
			{"uuid": nil},
		},
	}

	cursor, err := m.Environments.Find(ctx, filter)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var e Environment
		if err := cursor.Decode(&e); err != nil {
			return err
		}

		newUUID := uuid.NewString()
		_, err := m.Environments.UpdateByID(ctx, e.ID, bson.M{
			"$set": bson.M{
				"uuid":       newUUID,
				"updated_at": time.Now().UTC(),
			},
		})
		if err != nil {
			return err
		}
	}

	return cursor.Err()
}

// EnsureUserUUIDs migrates any users missing a UUID by assigning a new unique UUID.
func (m *MongoManager) EnsureUserUUIDs(ctx context.Context) error {
	filter := bson.M{
		"$or": []bson.M{
			{"uuid": bson.M{"$exists": false}},
			{"uuid": ""},
			{"uuid": nil},
		},
	}

	cursor, err := m.Users.Find(ctx, filter)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var u User
		if err := cursor.Decode(&u); err != nil {
			return err
		}

		newUUID := uuid.NewString()
		_, err := m.Users.UpdateByID(ctx, u.ID, bson.M{
			"$set": bson.M{
				"uuid":       newUUID,
				"updated_at": time.Now().UTC(),
			},
		})
		if err != nil {
			return err
		}
	}

	return cursor.Err()
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

func (m *MongoManager) CountUsers(ctx context.Context) (int64, error) {
	return m.Users.CountDocuments(ctx, bson.M{})
}

func (m *MongoManager) RegisterUser(ctx context.Context, username, password string) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	user := &User{
		UUID:      uuid.NewString(),
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

func (m *MongoManager) GetUserByUUID(ctx context.Context, userUUID string) (*User, error) {
	var user User
	err := m.Users.FindOne(ctx, bson.M{"uuid": userUUID}).Decode(&user)
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

// Project methods

func (m *MongoManager) ProjectExists(name string) bool {
	exists, _ := m.ProjectExistsWithContext(context.Background(), name)
	return exists
}

func (m *MongoManager) ProjectExistsWithContext(ctx context.Context, name string) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	count, err := m.Projects.CountDocuments(ctx, bson.M{"name": name})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (m *MongoManager) SaveProject(ctx context.Context, project *Project) error {
	now := time.Now().UTC()
	project.UpdatedAt = now

	if project.UUID == "" {
		project.UUID = uuid.NewString()
	}

	if project.ID.IsZero() {
		project.CreatedAt = now
		res, err := m.Projects.InsertOne(ctx, project)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return ErrProjectAlreadyExists
			}
			return err
		}
		if oid, ok := res.InsertedID.(bson.ObjectID); ok {
			project.ID = oid
		}
		return nil
	}

	update := bson.M{
		"$set": project,
	}
	res, err := m.Projects.UpdateByID(ctx, project.ID, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrProjectNotFound
	}
	return nil
}

func (m *MongoManager) GetProjects(ctx context.Context) ([]Project, error) {
	cursor, err := m.Projects.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []Project
	if err := cursor.All(ctx, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func (m *MongoManager) GetProjectsByUserUUID(ctx context.Context, userUUID string) ([]Project, error) {
	cursor, err := m.Projects.Find(ctx, bson.M{"user_uuid": userUUID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []Project
	if err := cursor.All(ctx, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func (m *MongoManager) GetProjectByName(ctx context.Context, name string) (*Project, error) {
	var project Project
	err := m.Projects.FindOne(ctx, bson.M{"name": name}).Decode(&project)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

func (m *MongoManager) GetProjectByID(ctx context.Context, id bson.ObjectID) (*Project, error) {
	var project Project
	err := m.Projects.FindOne(ctx, bson.M{"_id": id}).Decode(&project)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

func (m *MongoManager) DeleteProject(ctx context.Context, id bson.ObjectID) error {
	res, err := m.Projects.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrProjectNotFound
	}
	return nil
}

func (m *MongoManager) GetProjectByUUID(ctx context.Context, projectUUID string) (*Project, error) {
	var project Project
	err := m.Projects.FindOne(ctx, bson.M{"uuid": projectUUID}).Decode(&project)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

func (m *MongoManager) DeleteProjectByUUID(ctx context.Context, projectUUID string) error {
	res, err := m.Projects.DeleteOne(ctx, bson.M{"uuid": projectUUID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrProjectNotFound
	}
	return nil
}

// Environment methods

func (m *MongoManager) SaveEnvironment(ctx context.Context, env *Environment) error {
	now := time.Now().UTC()
	env.UpdatedAt = now

	if env.UUID == "" {
		env.UUID = uuid.NewString()
	}

	if env.Variables == nil {
		env.Variables = []EnvVariable{}
	}

	if env.ID.IsZero() {
		env.CreatedAt = now
		res, err := m.Environments.InsertOne(ctx, env)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return ErrEnvironmentAlreadyExists
			}
			return err
		}
		if oid, ok := res.InsertedID.(bson.ObjectID); ok {
			env.ID = oid
		}
		return nil
	}

	update := bson.M{
		"$set": env,
	}
	res, err := m.Environments.UpdateByID(ctx, env.ID, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrEnvironmentNotFound
	}
	return nil
}

func (m *MongoManager) GetProjectEnviroments(ctx context.Context, projectIdentifier string) ([]Environment, error) {
	projectUUID := projectIdentifier

	if proj, err := m.GetProjectByUUID(ctx, projectIdentifier); err == nil && proj != nil {
		projectUUID = proj.UUID
	} else if proj, err := m.GetProjectByName(ctx, projectIdentifier); err == nil && proj != nil {
		projectUUID = proj.UUID
	} else if objID, err := bson.ObjectIDFromHex(projectIdentifier); err == nil {
		if proj, err := m.GetProjectByID(ctx, objID); err == nil && proj != nil {
			projectUUID = proj.UUID
		}
	}

	filter := bson.M{
		"$or": []bson.M{
			{"project_uuid": projectUUID},
			{"project_uuid": projectIdentifier},
		},
	}

	cursor, err := m.Environments.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var envs []Environment
	if err := cursor.All(ctx, &envs); err != nil {
		return nil, err
	}

	if envs == nil {
		envs = []Environment{}
	}

	for i := range envs {
		if envs[i].Variables == nil {
			envs[i].Variables = []EnvVariable{}
		}
	}

	return envs, nil
}

func (m *MongoManager) GetProjectEnvironments(ctx context.Context, projectIdentifier string) ([]Environment, error) {
	return m.GetProjectEnviroments(ctx, projectIdentifier)
}

func (m *MongoManager) GetEnvironmentByUUID(ctx context.Context, envUUID string) (*Environment, error) {
	var env Environment
	err := m.Environments.FindOne(ctx, bson.M{"uuid": envUUID}).Decode(&env)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrEnvironmentNotFound
		}
		return nil, err
	}
	if env.Variables == nil {
		env.Variables = []EnvVariable{}
	}
	return &env, nil
}

func (m *MongoManager) GetEnvironmentByID(ctx context.Context, id bson.ObjectID) (*Environment, error) {
	var env Environment
	err := m.Environments.FindOne(ctx, bson.M{"_id": id}).Decode(&env)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrEnvironmentNotFound
		}
		return nil, err
	}
	if env.Variables == nil {
		env.Variables = []EnvVariable{}
	}
	return &env, nil
}

func (m *MongoManager) DeleteEnvironment(ctx context.Context, id bson.ObjectID) error {
	res, err := m.Environments.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrEnvironmentNotFound
	}
	return nil
}

func (m *MongoManager) DeleteEnvironmentByUUID(ctx context.Context, envUUID string) error {
	res, err := m.Environments.DeleteOne(ctx, bson.M{"uuid": envUUID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrEnvironmentNotFound
	}
	return nil
}
