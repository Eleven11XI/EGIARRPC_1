const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Import Nodemailer
const csv = require('csv-parser');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json());

let forms = [];

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
    const customMethod = req.headers['x-method'] || req.method; // Check custom header or regular method

    if (customMethod === 'POSTNOMAIL') {
        // Handle saving data without sending an email
        const { title, email, description, comment, budget, priority, completion, imageURL, dateAdded } = req.body;
        const taskId = generateTaskId(); // Generate unique ID for the task

        // Clean the data before saving to CSV (remove any quotes around the data)
        const strippedTitle = stripQuotes(title);
        const strippedEmail = stripQuotes(email);
        const strippedDescription = stripQuotes(description);
        const strippedComment = stripQuotes(comment);
        const strippedBudget = parseInt(stripQuotes(budget));
        const strippedPriority = parseInt(stripQuotes(priority));
        const strippedCompletion = stripQuotes(completion);
        const strippedImageURL = stripQuotes(imageURL);
        const strippedDateAdded = stripQuotes(dateAdded);

        const newRow = `${taskId},${strippedTitle},${strippedEmail},${strippedDescription},${strippedComment},${strippedBudget},${strippedPriority},${strippedCompletion},${strippedImageURL},${strippedDateAdded}\n`;
        // Save the data
        fs.appendFile('data.csv', '\n' + newRow, (err) => {
            if (err) {
                console.error('Error writing to CSV:', err);
                return res.status(500).json({ message: 'Failed to save data' });
            }          
        });

        res.json('Data saved without sending email');
    } else {

    const { title, email, description, comment, budget, priority, completion, imageURL, dateAdded } = req.body;

    const taskId = generateTaskId(); // Generate unique ID for the task
    
    // Clean the data before saving to CSV (remove any quotes around the data)
    const strippedTitle = stripQuotes(title);
    const strippedEmail = stripQuotes(email);
    const strippedDescription = stripQuotes(description);
    const strippedComment = stripQuotes(comment);
    const strippedBudget = parseInt(stripQuotes(budget));
    const strippedPriority = parseInt(stripQuotes(priority));
    const strippedCompletion = stripQuotes(completion);
    const strippedImageURL = stripQuotes(imageURL);
    const strippedDateAdded = stripQuotes(dateAdded);

    // Construct the new row with data (no quotes around the values)
    const newRow = `${taskId},${strippedTitle},${strippedEmail},${strippedDescription},${strippedComment},${strippedBudget},${strippedPriority},${strippedCompletion},${strippedImageURL},${strippedDateAdded}\n`;
    
    fs.appendFile('data.csv', newRow, (err) => {
        if (err) {
            console.error('Error writing to CSV:', err);
            return res.status(500).json({ message: 'Failed to save data' });
        }
        // Send email after saving data
        const emailSubject = 'New Task Saved';
        const emailText = `A new task has been saved:\n\nTitle: ${strippedTitle}\nEmail: ${strippedEmail}\nDescription: ${strippedDescription}\nComment: ${strippedComment}\nBudget: ${strippedBudget}\nPriority: ${strippedPriority}\nCompletion: ${strippedCompletion}\nImage URL: ${strippedImageURL}\nDate Added: ${strippedDateAdded}`;

        sendEmail(emailSubject, emailText)
            .then(() => {
                res.json('Data saved and email sent successfully');
            })
            .catch((error) => {
                console.error('Error sending email:', error);
                res.status(500).json({ message: 'Data saved, but failed to send email' });
            });
        
    });
    }
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


// Strip quotes and trim whitespace
const stripQuotes = (str) => {
    if (typeof str === 'string') {
        return str.replace(/^"|"$/g, '').trim(); // Remove quotes and trim whitespace
    }
    return str; // If it's not a string, return it as is
};

// Function to load data from CSV file
function loadFormsFromCSV() {
    forms = []; // Clear previous data
    fs.createReadStream("data.csv")
        .pipe(csv())
        .on("data", (row) => {
            // Use stripQuotes to clean each field before pushing to forms array
            forms.push({
                taskId: stripQuotes(row["taskId"]),
                title: stripQuotes(row["Title"]),
                email: stripQuotes(row["Email"]),
                description: stripQuotes(row["Description"]),
                comment: stripQuotes(row["Comments"]),
                budget: stripQuotes(row["Budget"]),
                priority: stripQuotes(row["Priority"]),
                completion: stripQuotes(row["Completion Date"]),
                imageURL: stripQuotes(row["URL"]),
                dateAdded: stripQuotes(row["Date Added"])
            });
        })
        .on("end", () => {
            console.log("CSV file successfully loaded!");
        })
        .on("error", (err) => {
            console.error("Error reading CSV:", err);
        });
}

// Load data when the server starts
loadFormsFromCSV();

// Endpoint to get all forms
app.get("/forms", (req, res) => {
    res.json(forms);
});

// Endpoint to get a form by taskId
app.get("/forms/:taskId", (req, res) => {
    const taskId = req.params.taskId;
    console.log(`🔍 Fetching form with taskId: ${taskId}`);
    const form = forms.find(f => f.taskId === taskId);

    if (form) {
        res.json(form);
    } else {
        res.status(404).json({ error: "Form not found" });
    }
});

// Endpoint to delete a form by taskId
app.delete('/forms/:taskId', (req, res) => {
    const { taskId } = req.params;
    try {
        if (!fs.existsSync('data.csv')) {
            return res.status(404).json({ message: 'No forms found' });
        }

        const data = fs.readFileSync('data.csv', 'utf-8');
        const rows = data.split('\n').filter(row => row.trim() !== '');
        const filteredRows = rows.filter(row => !row.startsWith(taskId)); // Remove the form with the matching taskId

        // If the form was not found, return an error
        if (filteredRows.length === rows.length) {
            return res.status(404).json({ message: 'Form not found' });
        }

        // Write the updated data back to the CSV file
        fs.writeFileSync('data.csv', filteredRows.join('\n'));

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Error reading or writing file:', error.message);
        res.status(500).json({ message: 'Failed to delete form' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
