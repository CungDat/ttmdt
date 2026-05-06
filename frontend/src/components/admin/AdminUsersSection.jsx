import React from 'react';

function AdminUsersSection({ users, setUsers, handleUpdateUserRole }) {
  return (
    <section className="admin-card admx-panel-wrap">
      <h2 className="admin-section-title">Manage Users</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="admin-select"
                    value={user.role || 'customer'}
                    onChange={(e) => {
                      const role = e.target.value;
                      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role } : item)));
                    }}
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <button type="button" className="admin-link-btn" onClick={() => handleUpdateUserRole(user.id, user.role)}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsersSection;
