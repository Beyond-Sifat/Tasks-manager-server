const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');

dotenv.config();
const app = express()
const port = process.env.PORT || 3000;


app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});


db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");


    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table: ' + err.message);
        } else {
            console.log('Tasks table ready');
        }
    });
});


app.get('/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks ORDER BY created_at DESC';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to fetch tasks',
                details: err.message
            });
        }
        res.json({
            message: 'Tasks fetched successfully',
            data: results
        });
    });
});

// GET /tasks/:id - Get single task
app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const query = 'SELECT * FROM tasks WHERE id = ?';

    db.query(query, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to fetch task',
                details: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json({
            message: 'Task fetched successfully',
            data: results[0]
        });
    });
});

app.post('/tasks', (req, res) => {
    const { title, description, status } = req.body;

    const query = "INSERT INTO tasks (title,description,status) VALUES (?,?,?)";
    const values = [title?.trim(), description?.trim() || null, status || 'pending']

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to create task',
                details: err.message
            });
        }

        res.status(201).json({
            message: 'Task created successfully',
            data: {
                id: results.insertId,
                title,
                description: description || null,
                status: status || 'pending'
            }
        });
    });
})

// PUT /tasks/:id - Update task
app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;

    // Check if task exists
    const checkQuery = 'SELECT * FROM tasks WHERE id = ?';

    db.query(checkQuery, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to update task',
                details: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        // Update task
        const updateQuery = `
        UPDATE tasks
        SET title = ?, description = ?, status = ?
        WHERE id = ?
    `;
        const values = [
            title || results[0].title,
            description !== undefined ? description : results[0].description,
            status || results[0].status,
            taskId
        ];

        db.query(updateQuery, values, (err) => {
            if (err) {
                return res.status(500).json({
                    error: 'Failed to update task',
                    details: err.message
                });
            }

            res.json({
                message: 'Task updated successfully'
            });
        });
    });
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    const query = 'DELETE FROM tasks WHERE id = ?';

    db.query(query, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to delete task',
                details: err.message
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json({
            message: 'Task deleted successfully'
        });
    });
});

// PATCH /tasks/:id/complete - Mark task as complete
app.patch('/tasks/:id/complete', (req, res) => {
    const taskId = req.params.id;

    const query = 'UPDATE tasks SET status = "completed" WHERE id = ?';

    db.query(query, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to update task',
                details: err.message
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json({
            message: 'Task marked as completed'
        });
    });
});

// PATCH /tasks/:id/pending - Mark task as pending
app.patch('/tasks/:id/pending', (req, res) => {
    const taskId = req.params.id;

    const query = 'UPDATE tasks SET status = "pending" WHERE id = ?';

    db.query(query, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to update task',
                details: err.message
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json({
            message: 'Task marked as pending'
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});




app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
module.exports = app;