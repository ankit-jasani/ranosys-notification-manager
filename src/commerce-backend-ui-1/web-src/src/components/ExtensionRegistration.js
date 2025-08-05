/**
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

import { register } from '@adobe/uix-guest'
import { useEffect } from 'react'
import { extensionId } from './Constants'
import NotificationsManager from './NotificationsManager'

export default function ExtensionRegistration(props) {

  useEffect(() => {
    (async () => {

      await register({
        id: extensionId,
        methods: {
        }
      })

    })()
  }, [])

  return <NotificationsManager ims={props.ims} runtime={props.runtime} />
}
