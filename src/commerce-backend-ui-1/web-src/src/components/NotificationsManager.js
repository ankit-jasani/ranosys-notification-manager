/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Flex,
  Heading,
  TextField,
  Button,
  TableView,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  Picker,
  Item,
  ProgressCircle,
  Divider
} from '@adobe/react-spectrum';
import { callAction } from '../utils';
import { v4 as uuid } from 'uuid';
import './NotificationsManager.css';

export default function NotificationsManager(props) {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ id: null, start: '', end: '', location: 'header', content: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await callAction(props, 'ranosysnotificationmanager/getNotifications');
      setNotifications(res.notifications || []);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchNotifications(); }, []);

  const onSubmit = async () => {
    const { id, start, end, location, content } = form;
    if (!content || !start || !end) return showToast('error', 'All fields are required.');
    if (new Date(end) < new Date(start)) return showToast('error', 'End must be after start.');

    setLoading(true);
    try {
      const actionName = id ? 'ranosysnotificationmanager/updateNotification' : 'ranosysnotificationmanager/createNotification';
      const params = id
        ? { id, updates: { start, end, location, content } }
        : { notification: { id: uuid(), start, end, location, content } };
      const res = await callAction(props, actionName, '', params);
      if (res.error) showToast('error', res.error);
      else {
        showToast('success', 'Saved');
        setForm({ id: null, start: '', end: '', location: 'header', content: '' });
        await fetchNotifications();
      }
    } catch (e) {
      showToast('error', e.message);
    } finally { setLoading(false); }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    setLoading(true);
    try {
      await callAction(props, 'ranosysnotificationmanager/deleteNotification', '', { id });
      showToast('success', 'Deleted');
      await fetchNotifications();
    } catch (e) {
      showToast('error', e.message);
    } finally { setLoading(false); }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Delete ALL notifications?')) return;
    setLoading(true);
    try {
      await callAction(props, 'ranosysnotificationmanager/deleteAllNotifications');
      showToast('success', 'All deleted');
      await fetchNotifications();
    } catch (e) {
      showToast('error', e.message);
    } finally { setLoading(false); }
  };

  const editNotification = (item) => setForm({ ...item });

  return (
    <View className="nm-container" padding={{ base: 'size-200', M: 'size-400' }}>
      {loading && (
        <div className="nm-overlay">
          <ProgressCircle size="LARGE" isIndeterminate />
        </div>
      )}

      <Heading level={3} marginBottom="size-300">Manage Notifications</Heading>

      <Flex direction="row" gap="size-150" wrap alignItems="end" marginBottom="size-300">
        <TextField
          flex="2"
          minWidth="size-3000"
          label="Content"
          value={form.content}
          onChange={(v) => setForm((f) => ({ ...f, content: v }))}
          isRequired
          isDisabled={loading}
        />
        <TextField
          flex="1"
          label="Start"
          type="datetime-local"
          value={form.start}
          onChange={(v) => setForm((f) => ({ ...f, start: v }))}
          isRequired
          isDisabled={loading}
        />
        <TextField
          flex="1"
          label="End"
          type="datetime-local"
          value={form.end}
          onChange={(v) => setForm((f) => ({ ...f, end: v }))}
          isRequired
          isDisabled={loading}
        />
        <Picker
          label="Position"
          selectedKey={form.location}
          onSelectionChange={(k) => setForm((f) => ({ ...f, location: k }))}
          width="size-2000"
          isDisabled={loading}
        >
          <Item key="header">Header</Item>
          <Item key="footer">Footer</Item>
        </Picker>
        <Button variant="cta" onPress={onSubmit} isDisabled={loading}>{form.id ? 'Update' : 'Save'}</Button>
        <Button variant="negative" onPress={deleteAllNotifications} isDisabled={loading || notifications.length === 0}>Delete All</Button>
      </Flex>

      <Divider size="S" marginY="size-300" />

      {notifications.length ? (
        <TableView aria-label="Notifications" overflowMode="wrap" density="compact" width="100%">
          <TableHeader>
            <Column width="40%">Content</Column>
            <Column width="15%">Start</Column>
            <Column width="15%">End</Column>
            <Column width="10%">Location</Column>
            <Column width="20%">Action</Column>
          </TableHeader>
          <TableBody items={notifications}>
            {(item) => (
              <Row key={item.id}>
                <Cell>{item.content}</Cell>
                <Cell>{item.start}</Cell>
                <Cell>{item.end}</Cell>
                <Cell>{item.location}</Cell>
                <Cell>
                  <Flex gap="size-100" wrap>
                    <Button variant="primary" onPress={() => editNotification(item)} isDisabled={loading}>Edit</Button>
                    <Button variant="negative" onPress={() => deleteNotification(item.id)} isDisabled={loading}>Delete</Button>
                  </Flex>
                </Cell>
              </Row>
            )}
          </TableBody>
        </TableView>
      ) : (
        <View>No notifications yet.</View>
      )}

      {toast && (
        <div className={`nm-toast ${toast.type}`}>  
          {toast.message}
        </div>
      )}
    </View>
  );
}

NotificationsManager.propTypes = {
  ims: PropTypes.shape({ token: PropTypes.string, org: PropTypes.string })
};
