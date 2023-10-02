# KarsaBuana-BE

## Description

KarsaBuana-BE is a Node.js backend application built with Express.js for an internal project. It leverages the Google Sheets API and Google Drive API to provide functionality for managing and interacting with Google Sheets and Google Drive resources.

## Features

- [ ] Feature 1: Copy form google sheets template.
- [ ] Feature 2: Change file permission.
- [ ] Feature 3: Separation of features for different roles.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/KarsaBuana-BE.git
   ```

2. **Install dependencies:**

   ```bash
   cd KarsaBuana-BE
   npm install
   ```

3. **Set up Google APIs:**

   - Follow Google's official documentation to create a project and obtain API credentials for Google Sheets and Google Drive.
   - Configure your API credentials following the instructions provided in `config/google-credentials.json`.

4. **Configure environment variables:**

   Create a `.env` file in the root directory of the project and add the following environment variables:

   ```env
   MONGODB_URI=your_mongodb_uri
   PASSWORD_LENGTH=your_password_length
   SPREADSHEETS_ID=your_spreadsheet_id
   CORS_ORIGINS=your_backend_url
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_LIFE=your_token_expiration_time
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_LIMIT=your_refresh_token_limit
   ```

5. **Start the application:**

   ```bash
   npm start
   ```

## Usage

Describe how to use your application, including API endpoints, authentication, and any other relevant details.

## API Documentation

Provide links or documentation for your API if available.

## Contributing

If you would like to contribute to this project, please follow these guidelines:

1. Fork the project.
2. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name` or `bugfix/your-bugfix-name`.
3. Make your changes and commit them with meaningful commit messages.
4. Push your changes to your fork: `git push origin feature/your-feature-name` or `bugfix/your-bugfix-name`.
5. Open a pull request to the `main` branch of this repository.

## License

This project is licensed under the MIT License.

## Contact

- Author: Exercise FTUI
- Email: exercise.ui@gmail.com

Feel free to contact us if you have any questions or feedback!
