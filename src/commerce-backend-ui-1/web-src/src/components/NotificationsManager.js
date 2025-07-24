/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View, Flex, Heading, TextField, Button, TableView,
  TableHeader, Column, TableBody, Row, Cell, Picker, Item,
  ProgressCircle, Divider
} from '@adobe/react-spectrum';
import { callAction } from '../utils';
import { v4 as uuid } from 'uuid';
import './NotificationsManager.css';

export default function NotificationsManager(props) {
  // UI states
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [form, setForm] = useState({
    id: null,
    start: '',
    end: '',
    position: 'header',
    content: ''
  });

  // Show temporary toast message
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all existing notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await callAction(props, 'ranosysnotificationmanager/getNotifications');
      setNotifications(res.data || []);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  const utcToDatetimeLocal = (utcStr) => {
    const date = new Date(utcStr);
    const offsetMs = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offsetMs);
    return local.toISOString().slice(0, 16);
  };

  const datetimeLocalToUTC = (localStr) => {
    return new Date(localStr).toISOString();
  };

  // Handle notification form submit (create/update)
  const onSubmit = async () => {
    const { id, start, end, position, content } = form;

    // Validate required fields
    if (!content || !start || !end) {
      return showToast('error', 'All fields are required.');
    }

    // Validate date logic
    if (new Date(end) < new Date(start)) {
      return showToast('error', 'End must be after start.');
    }

    // Convert datetime-local values to UTC ISO strings
    const startUtc = datetimeLocalToUTC(start);
    const endUtc = datetimeLocalToUTC(end);

    setLoading(true);
    try {
      // Select action based on form mode
      const actionName = id
        ? 'ranosysnotificationmanager/updateNotification'
        : 'ranosysnotificationmanager/createNotification';

      const params = id
        ? { data: { id, updates: { start: startUtc, end: endUtc, position, content } } }
        : { data: { id: uuid(), start: startUtc, end: endUtc, position, content } };

      const res = await callAction(props, actionName, '', params);

      // Handle response
      if (res.error) {
        showToast('error', res.error);
      } else {
        showToast('success', 'Saved');
        setForm({ id: null, start: '', end: '', position: 'header', content: '' });
        await fetchNotifications();
      }
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a single notification
  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    const params = id ? { data: { id } } : null;
    setLoading(true);
    try {
      await callAction(props, 'ranosysnotificationmanager/deleteNotification', '', params);
      showToast('success', 'Deleted');
      await fetchNotifications();
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!window.confirm('Delete ALL notifications?')) return;

    setLoading(true);
    try {
      await callAction(props, 'ranosysnotificationmanager/deleteAllNotifications');
      showToast('success', 'All deleted');
      await fetchNotifications();
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load form with notification data for editing
  const editNotification = (item) => {
    setForm({
      ...item,
      start: utcToDatetimeLocal(item.start),
      end: utcToDatetimeLocal(item.end)
    });
  };

  return (
    <View className="nm-container" padding={{ base: 'size-200', M: 'size-400' }}>
      {/* Loading spinner overlay */}
      {loading && (
        <div className="nm-overlay">
          <ProgressCircle size="LARGE" isIndeterminate />
        </div>
      )}

      <Heading level={3} marginBottom="size-300">Manage Notifications</Heading>

      {/* Notification Form */}
      <Flex direction="row" gap="size-150" wrap alignItems="end" marginBottom="size-300">
        <TextField
          flex="2"
          minWidth="size-3000"
          label="Content"
          value={form.content}
          onChange={(v) => setForm(f => ({ ...f, content: v }))}
          isRequired
          isDisabled={loading}
        />
        <TextField
          flex="1"
          label="Start"
          type="datetime-local"
          value={form.start}
          onChange={(v) => setForm(f => ({ ...f, start: v }))}
          isRequired
          isDisabled={loading}
        />
        <TextField
          flex="1"
          label="End"
          type="datetime-local"
          value={form.end}
          onChange={(v) => setForm(f => ({ ...f, end: v }))}
          isRequired
          isDisabled={loading}
        />
        <Picker
          label="Position"
          selectedKey={form.position}
          onSelectionChange={(k) => setForm(f => ({ ...f, position: k }))}
          width="size-2000"
          isDisabled={loading}
        >
          <Item key="header">Header</Item>
          <Item key="footer">Footer</Item>
        </Picker>
        <Button
          variant="cta"
          onPress={onSubmit}
          isDisabled={loading}
        >
          {form.id ? 'Update' : 'Save'}
        </Button>
        <Button
          variant="negative"
          onPress={deleteAllNotifications}
          isDisabled={loading || notifications.length === 0}
        >
          Delete All
        </Button>
      </Flex>

      <Divider size="S" marginY="size-300" />

      {/* Notification List */}
      {notifications.length ? (
        <TableView aria-label="Notifications" overflowMode="wrap" density="compact" width="100%">
          <TableHeader>
            <Column width="40%">Content</Column>
            <Column width="15%">Start</Column>
            <Column width="15%">End</Column>
            <Column width="10%">Position</Column>
            <Column width="20%">Action</Column>
          </TableHeader>
          <TableBody items={notifications}>
            {(item) => (
              <Row key={item.id}>
                <Cell>{item.content}</Cell>
                <Cell>{item.start}</Cell>
                <Cell>{item.end}</Cell>
                <Cell>{item.position}</Cell>
                <Cell>
                  <Flex gap="size-100" wrap>
                    <Button
                      variant="primary"
                      onPress={() => editNotification(item)}
                      isDisabled={loading}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="negative"
                      onPress={() => deleteNotification(item.id)}
                      isDisabled={loading}
                    >
                      Delete
                    </Button>
                  </Flex>
                </Cell>
              </Row>
            )}
          </TableBody>
        </TableView>
      ) : (
        <View>No notifications yet.</View>
      )}

      {/* Toast Message */}
      {toast && (
        <div className={`nm-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </View>
  );
}

NotificationsManager.propTypes = {
  ims: PropTypes.shape({
    token: PropTypes.string,
    org: PropTypes.string
  })
};
