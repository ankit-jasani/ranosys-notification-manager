# Adobe Commerce Admin UI SDK - Notification Manager

This application extends the Adobe Commerce Admin UI by adding notification manager using the Admin UI SDK.

## Overview

The Notification Manager is an extension of the Adobe Commerce Admin UI SDK that enhances the Commerce Admin interface by allowing administrators to schedule and display time‑bound notifications.

## Features

- **Admin Panel Management**: Promotion notifications or any other type of temporary notification can be easily created, edited, deleted, and scheduled right from the Adobe Commerce Admin Panel and retrieved via API calls for storefront.
- **Flexible Scheduling**: Create and schedule multiple notifications with specific start and end dates and times.
- **Separate Header & Footer Control**: Independently manage notifications sets for the header and the footer, ensuring targeted messaging in each area.
- **Easy Management**: Intuitive Admin UI integration makes it simple to add, edit, enable, or disable notifications without writing any custom code.
- **Note**: Notification Manager extension store data using in-built state container. There is a configurable time-to-live (TTL) for each key-value pair, the default is 1 day and the maximum is 1 year (365 days). For more information you can refer [documentation] (https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/application-state#feature-matrix). 

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
- To redirect to your local application, set up a server as described in the [Local Testing documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/), Notification Manager interface will be accessible from the Commerce Admin panel.