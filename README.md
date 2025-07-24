# Adobe Commerce Admin UI SDK - Notification Manager

This application extends the Adobe Commerce Admin UI by adding notification manager using the Admin UI SDK.

## Overview

The Notification Manager is an extension of the Adobe Commerce Admin UI SDK that enhances the Commerce Admin interface by allowing administrators to schedule and display time‑bound notifications.

## Features

- **Admin Panel Management**: Promotion notifications or any other type of temporary notification can be easily created, edited, deleted, and scheduled right from the Adobe Commerce Admin Panel and retrieved via API calls for storefront.
- **Flexible Scheduling**: Create and schedule multiple notifications with specific start and end dates and times.
- **Separate Header & Footer Control**: Independently manage notifications sets for the header and the footer, ensuring targeted messaging in each area.
- **Easy Management**: Intuitive Admin UI integration makes it simple to add, edit, enable, or disable notifications without writing any custom code.

## Note

- Notification Manager extension store data using in-built state container. There is a configurable time-to-live (TTL) for each key-value pair, the default is 1 day and the maximum is 1 year (365 days). For more information you can refer [documentation] (https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/application-state#feature-matrix). This extension is configured with a TTL of 365 days.
- In the Adobe Commerce admin panel, the admin sees the date and time in a localized format; however, it is first converted to UTC before being stored as a key-value pair. The listing view always displays the date and time in UTC.
- The position query parameter is used to filter notifications based on their position.
- The tz query parameter is used to filter notifications based on the provided timezone instead of the default UTC. Note that only the current time is converted to the specified timezone, and this converted time is then checked against the UTC-based start and end times of all notifications.
- The tzaware and tz query parameters are used together to filter notifications based on the provided timezone instead of the default UTC. In this case, both the current time and the notification start and end times are converted to the specified timezone before comparison.

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

## Postman Testing

1) Retrive all notifications

	**URL**
		`https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/allNotifications`

	**Headers**
		`Authorization: Bearer <TOKEN>
		x-gw-ims-org-id: <CUSTOM>@AdobeOrg`

	**Response**
		`{
		    "data": [
		        {
		            "content": "This notification is for header.",
		            "end": "2025-07-24T08:28:00.000Z",
		            "position": "header",
		            "start": "2025-07-24T07:32:00.000Z"
		        },
		        {
		            "content": "This notification is for footer.",
		            "end": "2025-07-24T09:28:00.000Z",
		            "position": "footer",
		            "start": "2025-07-24T08:32:00.000Z"
		        },
		        {
		            "content": "This notification is for left content area.",
		            "end": "2025-07-24T10:28:00.000Z",
		            "position": "left-content",
		            "start": "2025-07-24T09:32:00.000Z"
		        }
		    ]
		}`

2) Retrive all notifications with position filter

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/allNotifications?position=header

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z"
        }
    ]
}

3) Retrive all active notifications based on current UTC datetime
(Find all active notifications where the current UTC datetime falls between their start and end UTC datetimes.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/activeNotifications

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z",
            "adjustedStart": "2025-07-24T07:32:00.000Z",
            "adjustedEnd": "2025-07-24T08:28:00.000Z"
        }
    ]
}

4) Retrive all active notifications based on current UTC datetime with position filter 
(Find all active notifications where the current UTC datetime falls between their start and end UTC datetimes with position filter.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/activeNotifications?position=header

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z",
            "adjustedStart": "2025-07-24T07:32:00.000Z",
            "adjustedEnd": "2025-07-24T08:28:00.000Z"
        }
    ]
}

5) Retrieve all active notifications by converting the current UTC datetime to the provided timezone (tz) and applying a position filter
(Check if the current UTC datetime, when converted to the provided timezone (tz), falls between the start and end UTC datetimes of the active notifications with position filter.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/activeNotifications?tz=Asia/Kolkata&position=footer

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification is for footer.",
            "end": "2025-07-24T13:58:00.000Z",
            "position": "footer",
            "start": "2025-07-24T13:02:00.000Z",
            "adjustedStart": "2025-07-24T13:02:00.000Z",
            "adjustedEnd": "2025-07-24T13:58:00.000Z"
        }
    ]
}

6) Retrieve all active notifications by converting the current UTC datetime to the provided timezone (tz), also convert saved notification timezon from UTC to provided timezone (tz)
(Verify whether the current time in the given timezone (tz) falls within the start and end times of each active notification, both adjusted to that timezone.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/activeNotifications?tz=Asia/Singapore&tzaware=true

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z",
            "adjustedStart": "2025-07-24T15:32:00.000Z",
            "adjustedEnd": "2025-07-24T16:28:00.000Z"
        }
    ]
}

7) Retrive all live notifications (active notifications + future notifications) based on current UTC datetime
(Find all live notifications (active notifications + future notifications) where the current UTC datetime falls between their start and end UTC datetimes.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/liveNotifications

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification 1 is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z",
            "adjustedStart": "2025-07-24T07:32:00.000Z",
            "adjustedEnd": "2025-07-24T08:28:00.000Z"
        },
        {
            "content": "This notification 2 is for header.",
            "end": "2025-07-24T09:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T08:32:00.000Z",
            "adjustedStart": "2025-07-24T08:32:00.000Z",
            "adjustedEnd": "2025-07-24T09:28:00.000Z"
        },
        {
            "content": "This notification 3 is for header.",
            "end": "2025-07-24T10:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T09:32:00.000Z",
            "adjustedStart": "2025-07-24T09:32:00.000Z",
            "adjustedEnd": "2025-07-24T10:28:00.000Z"
        },
        {
            "content": "This notification 1 is for footer.",
            "end": "2025-07-24T13:58:00.000Z",
            "position": "footer",
            "start": "2025-07-24T13:02:00.000Z",
            "adjustedStart": "2025-07-24T13:02:00.000Z",
            "adjustedEnd": "2025-07-24T13:58:00.000Z"
        }
    ]
}

8) Retrive all live notifications (active notifications + future notifications) based on current UTC datetime with position filter 
(Find all live notifications (active notifications + future notifications) where the current UTC datetime falls between their start and end UTC datetimes with position filter.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/liveNotifications?position=header

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification 1 is for header.",
            "end": "2025-07-24T08:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T07:32:00.000Z",
            "adjustedStart": "2025-07-24T07:32:00.000Z",
            "adjustedEnd": "2025-07-24T08:28:00.000Z"
        },
        {
            "content": "This notification 2 is for header.",
            "end": "2025-07-24T09:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T08:32:00.000Z",
            "adjustedStart": "2025-07-24T08:32:00.000Z",
            "adjustedEnd": "2025-07-24T09:28:00.000Z"
        },
        {
            "content": "This notification 3 is for header.",
            "end": "2025-07-24T10:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T09:32:00.000Z",
            "adjustedStart": "2025-07-24T09:32:00.000Z",
            "adjustedEnd": "2025-07-24T10:28:00.000Z"
        }
    ]
}

9) Retrieve all live notifications (active notifications + future notifications) by converting the current UTC datetime to the provided timezone (tz) and applying a position filter
(Check if the current UTC datetime, when converted to the provided timezone (tz), falls between the start and end UTC datetimes of the live notifications (active notifications + future notifications) with position filter.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/liveNotifications?tz=Asia/Kolkata&position=footer

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification 1 is for footer.",
            "end": "2025-07-24T13:58:00.000Z",
            "position": "footer",
            "start": "2025-07-24T13:02:00.000Z",
            "adjustedStart": "2025-07-24T13:02:00.000Z",
            "adjustedEnd": "2025-07-24T13:58:00.000Z"
        }
    ]
}

10) Retrieve all live notifications (active notifications + future notifications) by converting the current UTC datetime to the provided timezone (tz), also convert saved notifications timezone from UTC to provided timezone (tz)
(Verify whether the current time in the given timezone (tz) falls within the start and end times of each active notification, both adjusted to that timezone.)

https://<CUSTOM>.adobeio-static.net/api/v1/web/ranosysnotificationmanager/activeNotifications?tz=Asia/Singapore&tzaware=true

Headers
Authorization: Bearer <TOKEN>
x-gw-ims-org-id: <CUSTOM>@AdobeOrg

Response
{
    "data": [
        {
            "content": "This notification 2 is for header.",
            "end": "2025-07-24T09:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T08:32:00.000Z",
            "adjustedStart": "2025-07-24T16:32:00.000Z",
            "adjustedEnd": "2025-07-24T17:28:00.000Z"
        },
        {
            "content": "This notification 3 is for header.",
            "end": "2025-07-24T10:28:00.000Z",
            "position": "header",
            "start": "2025-07-24T09:32:00.000Z",
            "adjustedStart": "2025-07-24T17:32:00.000Z",
            "adjustedEnd": "2025-07-24T18:28:00.000Z"
        },
        {
            "content": "This notification 1 is for footer.",
            "end": "2025-07-24T13:58:00.000Z",
            "position": "footer",
            "start": "2025-07-24T13:02:00.000Z",
            "adjustedStart": "2025-07-24T21:02:00.000Z",
            "adjustedEnd": "2025-07-24T21:58:00.000Z"
        }
    ]
}