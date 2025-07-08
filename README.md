## Overview

The Ranosys Notification Manager is an extension of the Adobe Commerce Admin UI SDK that enhances the Commerce Admin interface by allowing administrators to schedule and display time‑bound notifications in both the page header and footer.

## Features

- **Flexible Scheduling**: Create and schedule multiple notifications with specific start and end dates and times.
- **Separate Header & Footer Control**: Independently manage notification sets for the header and the footer, ensuring targeted messaging in each area.
- **Easy Management**: Intuitive Admin UI integration makes it simple to add, edit, enable, or disable notifications without writing any custom code.

## Prerequisites

- An Adobe Commerce instance with the IMS module installed and enabled.
- Adobe Commerce Admin UI SDK installed and enabled.
- Access to the App Builder developer console for your organization.
- An existing App Builder project.

## Installation

1. Run `npm install` to install dependencies.
2. Run `aio login` to authenticate with your Adobe I/O account.
3. Run `aio app use` and select the appropriate project and workspace.
5. Run `aio app build` to build the application.
6. Run `aio app deploy` to deploy the application.

## Local Testing

- Run `aio app dev` to start the local development server.
- Ensure that the `require-adobe-auth` field in your runtime actions is set to `false`, since tokens cannot be generated locally.
- To redirect to your local application, set up a server as described in the [Local Testing documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/), Ranosys Notification Manager interface will be accessible from the Commerce Admin panel.