/**
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

export async function callAction(props, action, operation, body = {}) {
  const actions = require('./config.json')
  const res = await fetch(actions[action], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gw-ims-org-id': props.ims.org,
      'authorization': `Bearer ${props.ims.token}`
    },
    body: JSON.stringify({
      operation,
      ...body
    })
  })

  return await res.json()
}


