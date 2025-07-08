/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

import { register } from '@adobe/uix-guest'
import { useEffect } from 'react'
import { extensionId } from './Constants'
import NotificationsManager from './NotificationsManager'
import { attach } from '@adobe/uix-guest'

export default function ExtensionRegistration(props) {

  useEffect(() => {
    (async () => {
      await register({
        id: extensionId,
        methods: {
        }
      })
    })()
  }, []);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!props.ims.token) {
        const guestConnection = await attach({ id: extensionId });
        props.ims.token = guestConnection?.sharedContext?.get('imsToken');
        props.ims.org = guestConnection?.sharedContext?.get('imsOrgId');
      }
      setIsLoading(false);
    };
    fetchCredentials();
  }, []);

  return <NotificationsManager ims={props.ims} runtime={props.runtime} />
}
