const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Import Nodemailer
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json());

const generateTaskId = () => `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Set up Nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Use environment variable
        pass: process.env.EMAIL_PASS   // Use environment variable
    }
});

console.log('Email:', process.env.EMAIL_USER);
console.log('Password:', process.env.EMAIL_PASS ? 'Loaded' : 'Not Loaded');

// Function to send email
const sendEmail = (subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Sender address
        to: '59.e.griffin@gmail.com', // List of recipients
        subject: subject,  // Email subject
        text: text  // Email body text
    };

    return transporter.sendMail(mailOptions);
};

// Endpoint to save form data to CSV and send email
app.post('/save', (req, res) => {
    const { title, email, description, comment, budget, priority, completion, imageURL, dateAdded } = req.body;

    const taskId = generateTaskId(); // Generate unique ID for the task
    
    const newRow = `"${taskId}","${title}","${email}","${description}","${comment}","${budget}","${priority}","${completion}","${imageURL}","${dateAdded}"\n`;
    
    fs.appendFile('data.csv', newRow, (err) => {
        if (err) {
            console.error('Error writing to CSV:', err);
            return res.status(500).json({ message: 'Failed to save data' });
        }

        // Send email after saving data
        const emailSubject = 'New Task Saved';
        const emailText = `A new task has been saved:\n\nTitle: ${title}\nEmail: ${email}\nDescription: ${description}\nComment: ${comment}\nBudget: ${budget}\nPriority: ${priority}\nCompletion: ${completion}\nImage URL: ${imageURL}\nDate Added: ${dateAdded}`;

        sendEmail(emailSubject, emailText)
            .then(() => {
                res.json('Data saved and email sent successfully');
            })
            .catch((error) => {
                console.error('Error sending email:', error);
                res.status(500).json({ message: 'Data saved, but failed to send email' });
            });
    });
});

// Endpoint to fetch all saved forms (for selection)
app.get('/forms', (req, res) => {
    try {
        if (!fs.existsSync('data.csv')) {
            return res.json([]);
        }

        const data = fs.readFileSync('data.csv', 'utf-8');
        const rows = data.split('\n').filter(row => row.trim() !== '');
        const forms = rows.map(row => {
            const [taskId, title, email, description, comment, budget, priority, completion, imageURL, dateAdded] = row.split(',');
            return { taskId, title, email, description, comment, budget, priority, completion, imageURL, dateAdded };
        });

        res.json(forms);
    } catch (error) {
        console.error('Error reading file:', error.message);
        res.status(500).json({ message: 'Failed to fetch forms' });
    }
});

// Endpoint to fetch a specific form by taskId
app.get('/form/:taskId', (req, res) => {
    const { taskId } = req.params;

    try {
        if (!fs.existsSync('data.csv')) {
            return res.status(404).json({ message: 'No forms found' });
        }

        const data = fs.readFileSync('data.csv', 'utf-8');
        const rows = data.split('\n').filter(row => row.trim() !== '');
        const form = rows.find(row => row.startsWith(taskId));

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        const [_, title, email, description, comment, budget, priority, completion, imageURL, dateAdded] = form.split(',');
        res.json({ taskId, title, email, description, comment, budget, priority, completion, imageURL, dateAdded });
    } catch (error) {
        console.error('Error reading file:', error.message);
        res.status(500).json({ message: 'Failed to fetch form' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
