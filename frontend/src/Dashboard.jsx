import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard({ token, setToken }) {
    const [customers, setCustomers] = useState([]);
    const [name, setName] = useState('');
    const [membershipType, setMembershipType] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/readCustomer', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            } else {
                setMessage('Failed to fetch customers');
            }
        } catch (error) {
            setMessage('Server Error');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/Customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, membershipType }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Customer Added Successfully');
                setName('');
                setMembershipType('');
                fetchCustomers();
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Server Error');
        }
    };

    const handleEdit = (customer) => {
        setName(customer.name);
        setMembershipType(customer.membershipType);
        setEditingId(customer._id);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/Customer/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, membershipType }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Customer Updated Successfully');
                setName('');
                setMembershipType('');
                setEditingId(null);
                fetchCustomers();
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Server Error');
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/Customer/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Customer Deleted Successfully');
                fetchCustomers();
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Server Error');
        }
    };

    const handleLogout = () => {
        setToken(null);
        navigate('/login');
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <button onClick={handleLogout}>Logout</button>
            <h3>Add/Edit Customer</h3>
            <form onSubmit={editingId ? handleUpdate : handleAdd}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Membership Type"
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    required
                />
                <button type="submit">{editingId ? 'Update' : 'Add'} Customer</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setMembershipType(''); }}>Cancel</button>}
            </form>
            {message && <p>{message}</p>}
            <h3>Customers</h3>
            <ul>
                {customers.map((customer) => (
                    <li key={customer._id}>
                        {customer.name} - {customer.membershipType}
                        <button onClick={() => handleEdit(customer)}>Edit</button>
                        <button onClick={() => handleDelete(customer._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Dashboard;