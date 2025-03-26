// Sets the current date inside an element with ID "currentDate"
document.addEventListener("DOMContentLoaded", function () {
    const today = new Date();
    const options = {month: "long", day: "numeric" };
    const formattedDate = today.toLocaleDateString("en-US", options);
    document.getElementById("currentDate").textContent = formattedDate;
});

function testPassword() {
    let inputField = document.getElementById("pinID"); // Get the input field element
    let userInput = inputField.value.trim(); // Get trimmed input value

    let correctPassword = "123456"; // Define the correct password

    if (userInput === correctPassword) {
        localStorage.setItem("savedText", userInput); // Store input in localStorage
        document.getElementById("displayText").textContent = "You entered: " + userInput;
        inputField.value = ""; // Clear input field

        window.location.href = "OpenForms.html"; // Redirect to home page
    } else {
        alert("Incorrect Pin. Please try again."); // Alert for incorrect password
        inputField.value = ""; // Clear input field on incorrect input
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("saveButton").addEventListener("click", function () {
        console.log("Save button clicked!");
        let formData = {
            title: document.getElementById("TitleID")?.value || "N/A",
            email: document.getElementById("EmailID")?.value || "N/A",
            description: document.getElementById("DescriptionID")?.value || "N/A",
            comment: document.getElementById("CommentID")?.value || "N/A",
            budget: document.getElementById("BudgetID")?.value || "N/A",
            priority: document.getElementById("PriorityID")?.value || "N/A",
            completion: document.getElementById("DateID")?.value || "N/A",
            imageURL: document.getElementById("ImageID")?.value || "N/A",
            dateAdded: document.getElementById("currentDate")?.textContent || "N/A"
        };

        fetch("http://localhost:3000/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.text())
        .then(data => alert(data))
        .catch(error => console.error("Error:", error));

        alert(
            `
            Title: ${formData.title}
            Email: ${formData.email}
            Description: ${formData.description}
            Comment: ${formData.comment}
            Budget: ${formData.budget}
            Priority: ${formData.priority}
            Completion Date: ${formData.completion}
            Image URL: ${formData.imageURL}
            Date Added: ${formData.dateAdded}`
        );

    });
});// This code sets up an event listener for the "Save" button to collect form data and send it to the server via a POST request.

document.addEventListener("DOMContentLoaded", () => {
    fetchForms();
});

// Fetch forms from API
function fetchForms() {
    fetch("http://localhost:3000/forms")
        .then(response => response.json())
        .then(forms => {
            // Sort by dateAdded (newest first)
            forms.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            
            const dropdown = document.getElementById("formSelect");
            const tableBody = document.querySelector("#formsTable tbody");            

            // Populate dropdown with **all forms** (not just recent ones)
            dropdown.innerHTML = '<option value="">-- Choose a Form --</option>';
            forms.forEach(form => {
                const option = document.createElement("option");
                option.value = form.taskId;
                option.textContent = `${form.title} (${new Date(form.dateAdded).toLocaleDateString()})`;
                dropdown.appendChild(option);
            });

            // Get only the 3 most recent forms
            const recentForms = forms.slice(0, 3);

            tableBody.innerHTML = ""; // Clear table body before populating
            recentForms.forEach(form => {
                // Populate dropdown
                const option = document.createElement("option");
                option.value = form.taskId;
                option.textContent = form.title;

                // Populate table
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${form.taskId}</td>
                    <td>${form.title}</td>
                    <td>${form.priority}</td>
                    <td>${form.completion}</td>
                    <td>${form.dateAdded}</td>
                `;
                tableBody.appendChild(row);
            });

            // Enable the "Edit" and "Delete" buttons when a form is selected from the dropdown
            dropdown.addEventListener('change', () => {
                const editButton = document.getElementById("editButton");
                if (dropdown.value) {
                    editButton.disabled = false; // Enable the button if a form is selected
                    deleteButton.disabled = false; // Enable the button if a form is selected
                } else {
                    editButton.disabled = true; // Disable if no form is selected
                    deleteButton.disabled = true; // Disable if no form is selected
                }
            });

        })
        .catch(error => console.error("Error fetching forms:", error));
}


function editSelectedForm() {
    const selectedTaskId = document.getElementById("formSelect").value;
    if (selectedTaskId) {
        window.location.href = `EditForms.html?taskId=${selectedTaskId}`;
    } else {
        console.error("No form selected.");
    }
}

function deleteSelectedForm() {
    const selectedTaskId = document.getElementById("formSelect").value;
    if (selectedTaskId) {
        // Make the DELETE request to the server
        fetch(`http://localhost:3000/forms/${selectedTaskId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            alert('Form deleted successfully');
            // Reload the forms to reflect the deletion
            fetchForms();
        })
        .catch(error => {
            console.error("Error deleting form:", error);
            alert("Failed to delete form");
        });
    } else {
        alert("No form selected to delete.");
    }
}

function editForm(taskId) {
    console.log("Editing form with taskId:", taskId);  // Debugging taskId value
    if (taskId) {
        window.location.href = `EditForms.html?taskId=${taskId}`;
    } else {
        console.error("Task ID is missing or invalid.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Save button for editing forms
    document.getElementById("submitButtonEdit").addEventListener("click", function () {
        const taskId = getTaskIdFromURL(); // Get taskId from the URL
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }

        // Collect the updated form data from the form fields
        let updatedData = {
            taskId: taskId, // Use taskId to delete the old form
            title: document.getElementById("TitleID").value || "N/A",
            email: document.getElementById("EmailID").value || "N/A",
            description: document.getElementById("DescriptionID").value || "N/A",
            comment: document.getElementById("CommentID").value || "N/A",
            budget: document.getElementById("BudgetID").value || "N/A",
            priority: document.getElementById("PriorityID").value || "N/A",
            completion: document.getElementById("DateID").value || "N/A",
            imageURL: document.getElementById("ImageID").value || "N/A",
            dateAdded: document.getElementById("currentDate").textContent || "N/A"
        };

        // First, send request to delete the old form
        fetch(`http://localhost:3000/forms/${taskId}`, {
            method: "DELETE",
        })
        .then(response => response.json())
        .then(() => {

            // After deleting the old form, create the new one with the updated data
            return fetch("http://localhost:3000/save", {
                method: "POST",  // Use regular POST
                headers: {
                    "Content-Type": "application/json",
                    "x-method": "POSTNOMAIL"  // Send custom header to indicate no email should be sent
                },
                body: JSON.stringify(updatedData)
            });
        })
        .then(response => response.json())
        .then(data => {
            alert("Form updated successfully!");
            window.location.href = "OpenForms.html"; // Redirect after successful update
        })
        .catch(error => {
            console.error("Error updating form:", error);
            alert("Failed to update form.");
        });
    });
});

// Function to get the taskId from the URL
function getTaskIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("taskId"); // Extract taskId from URL
}