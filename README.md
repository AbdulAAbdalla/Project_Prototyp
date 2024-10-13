## Timothy's Software Firm
Welcome to the project repository for Timothy's Software Firm Online Client Servicing and Management Platform.

## Project Overview
This project is a website designed to help Timothy, a recent graduate, start his software firm. 
The website allows clients to:
View services offered
Register as a User to create a profile
Log into the system as a user
Make inquiries
Book for services
Make payments using various methods such as M-pesa,Paypal,Credit Card and Bank Transfer
Manage client information and payments

## Technologies Used
HTML: For structuring the web pages.
CSS: For styling the web pages.
JavaScript: For adding interactivity to the web pages.
Node.js: For backend server functionality (handled by server.js).

## Project Structure
index.html: The main HTML file for the website.
styles.css: Contains all CSS styles for the website.
script.js: Contains JavaScript code for interactivity.
server.js: Node.js server file for handling backend logic.


## How to Use
Clone the Repository
git clone https://github.com/username/repository-name.git
cd repository-name
Install Dependencies Ensure you have Node.js installed. Install the necessary npm packages:
Create your own .env file to contain confidential login details which should be 
included in the .gitignore file when sharing publicly with the following structure ;
DB_HOST=localhost
DB_USER=""
DB_PASSWORD=""
DB_NAME=""
JWT_SECRET=
PORT="port-number"
ENCRYPTION_KEY=

## npm install

This will install the dependencies,extensions to create the correct environment for the App
Start the server to run the website locally: use 'npm run devStart' command to start the server.
node server.js
The website will be available at http://localhost:port_number e.g port=4000.
Open in Browser Navigate to http://localhost:port_number in your web browser to view the website.

## Features

Service Viewing: Users can view the list of services offered.
Service Booking: Clients can book a service through the booking form.
Enquiries: Clients can make enquiries using the contact form.
Client Management: Manage client information and payment details.
About Us- This is an overview of the Timothy's firm
Contact us- This section is containing the contact of the firm
Signup/Login section- This is for Registering as a user and login to start using the system


## CSS Code Explanation

.notification: Styles for notifications that appear on the website.
body: General styling for the body, including font and background color.
header: Styling for the website's header section.
nav: Styles for the navigation menu.
section: Styling for content sections.
form: Styling for forms, including input fields and buttons.
.payment-methods and .payment-info: Styles specific to the payment methods section and payment information.

## JavaScript Code Explanation

Client Management: JavaScript code dynamically updates the client list displayed on the webpage. The displayClients function creates and appends client information to the client list.
Form Handling: JavaScript handles form submissions, prevents default behavior, and provides feedback through alerts.
Server.js
The server.js file sets up an Express.js server that serves the website and handles backend operations.

## Payment Section
This section is hidden from visitors until one is registered,logged in and book for a service
It will automatically be visible to choose which method of payment to use.

Contributing
Feel free to fork the repository and submit pull requests. For major changes, please open an issue to discuss before making changes.

## License
This project is my original work done using online research,
course work, and knowledge gained over the period of study to come up with this webApp Application .

## Acknowledgements
Thanks to the contributors and libraries used in the development of this project.
##

## Author
Ali Abdallah Abdul
PLP February2024 Cohort.
Final  Project
