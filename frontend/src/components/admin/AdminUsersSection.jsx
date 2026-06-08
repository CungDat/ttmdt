import React, { useMemo, useState } from 'react';
import { formatDate } from '../../pages/admin/adminConstants';

function AdminUsersSection({ users, setUsers, handleUpdateUserRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (!query) return true;
      return (
        String(user.name || '').toLowerCase().includes(query) ||
        String(user.email || '').toLowerCase().includes(query) ||
        String(user.phone || '').toLowerCase().includes(query)
      );
    });

    if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => String(b.name || '').localeCompare(String(a.name || ''), 'vi'));
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return result;
  }, [users, searchQuery, roleFilter, sortBy]);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const customerCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <section className="admin-card admx-panel-wrap">
      <div className="admx-orders-header">
        <h2 className="admin-section-title">Customer Management</h2>
        <span className="admx-orders-count">{filteredUsers.length} / {users.length} accounts</span>
      </div>

      {/* Summary */}
      <div className="admx-product-metrics">
        <div className="admx-product-metric">
          <span>Total Accounts</span>
          <strong>{users.length}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Customers</span>
          <strong>{customerCount}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Administrators</span>
          <strong>{adminCount}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="admx-product-toolbar">
        <input
          className="admin-input"
          placeholder="Search by name, email, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name-asc">Name A→Z</option>
          <option value="name-desc">Name Z→A</option>
        </select>
      </div>

      {/* Users table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date Created</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admx-user-cell">
                    <span className="admx-user-cell-avatar">{(user.name || 'U').slice(0, 1).toUpperCase()}</span>
                    <strong>{user.name || 'N/A'}</strong>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <select
                    className="admin-select"
                    value={user.role || 'customer'}
                    onChange={(e) => {
                      const role = e.target.value;
                      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role } : item)));
                    }}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-primary-btn admx-user-save-btn"
                    onClick={() => {
                      if (user.role === 'admin' && window.confirm(`Confirm grant Admin access to "${user.name}"?`)) {
                        handleUpdateUserRole(user.id, user.role);
                      } else if (user.role !== 'admin') {
                        handleUpdateUserRole(user.id, user.role);
                      }
                    }}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="admx-empty-text">No accounts found matching the criteria.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsersSection;
