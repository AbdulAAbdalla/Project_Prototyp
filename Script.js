// Function to handle booking form submission
document.getElementById('booking-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const service = document.getElementById('service').value;

    alert(`Thank you ${name} for booking a ${service} service! We will contact you at ${email}.`);
});

// Function to handle enquiry form submission
document.getElementById('enquiry-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('enquiry-name').value;
    const email = document.getElementById('enquiry-email').value;
    const message = document.getElementById('message').value;

    alert(`Thank you ${name} for your enquiry! We will respond to you at ${email}.`);
});

// Function to dynamically update client list (for demonstration purposes)
const clients = [
    { name: 'Client A', project: 'Web Development' },
    { name: 'Client B', project: 'Mobile Development' },
]; 


function displayClients() {
    const clientList = document.getElementById('client-list');
    clientList.innerHTML = '';
    clients.forEach(client => {
        const clientDiv = document.createElement('div');
        clientDiv.textContent = `${client.name}: ${client.project}`;
        clientList.appendChild(clientDiv);
    });
}

// Function to show and hide sections
function showSection(sectionId) {
    // Hide all sections
    var sections = document.querySelectorAll('.section');
    sections.forEach(function(section) {
        section.style.display = 'none';
    });

    // Show the selected section
    var sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

// Function to shift sections automatically every 5 seconds
function shiftSectionsAutomatically() {
    const links = document.querySelectorAll('header nav ul li a');
    let currentIndex = 0;
    const intervalId = setInterval(() => {
        if (currentIndex >= links.length) {
            currentIndex = 0;
        }
        const sectionId = links[currentIndex].getAttribute('href').substring(1);
        showSection(sectionId);
        currentIndex++;
    }, 5000);

    // Stop shifting when a navigation link is clicked
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            clearInterval(intervalId);
        });
    });
}

// Display clients and start shifting sections automatically on page load
document.addEventListener('DOMContentLoaded', function() {
    displayClients();
    showSection('home');  // Show the home section by default on page load
    shiftSectionsAutomatically(); // Start shifting through sections automatically
});
