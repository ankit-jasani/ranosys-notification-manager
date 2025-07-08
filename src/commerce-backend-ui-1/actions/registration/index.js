/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

async function main() {
    const extensionId = 'ranosysnotificationmanager'

    return {
        statusCode: 200,
        body: {
            registration: {
                menuItems: [
                    {
                        id: `${extensionId}::first`,
                        title: 'Notification Manager',
                        parent: `${extensionId}::apps`,
                        sortOrder: 1
                    },
                    {
                        id: `${extensionId}::apps`,
                        title: 'Ranosys',
                        isSection: true,
                        sortOrder: 100
                    }
                ],
                page: {
                    title: 'Notification Manager'
                }
            }
        }
    }
}

exports.main = main
