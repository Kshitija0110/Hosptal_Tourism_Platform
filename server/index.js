const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// AWS RDS MySQL connection
const pool = mysql.createPool({
  host:'hospitaldb.clu22e6ewt5r.eu-north-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Kshitu123',
  database: 'HOSPITAL',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection failed:', err);
      return;
    }
    console.log('Connected to database successfully');
    connection.release();
  });
  
// Get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM doctors');
    res.json(rows);
    //console.log(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching doctors' });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  const { doctor_id, patient_name, appointment_date, appointment_time, status } = req.body;
  
  try {
    const [result] = await pool.promise().query(
      `INSERT INTO appointments (doctor_id, patient_name, patient_email,appointment_date, appointment_time, status,created_at) VALUES ( ?, ?, ?, ?,?,'scheduled', 'pending')`,
      [doctor_id, 'abc','kshitu', appointment_date, appointment_time]
    );
    res.json({ id: result.insertId, message: 'Appointment booked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error booking appointment' });
  }
});

// Add this new endpoint to handle appointment cancellation
app.delete('/api/appointments/:id', async (req, res) => {
  const appointmentId = req.params.id;
  
  try {
    const [result] = await pool.promise().query(
      'DELETE FROM appointments WHERE appointment_id = ?',
      [appointmentId]
    );

    if (result.affectedRows > 0) {
      res.json({ message: 'Appointment cancelled successfully' });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Error cancelling appointment' });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.payment_status,
        a.patient_name,
        d.Name1 as doctor_name,
        d.speciality
      FROM appointments a 
      JOIN doctors d ON a.doctor_id = d.id 
      ORDER BY a.appointment_date DESC, a.appointment_time DESC 

    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// Get doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.id]
    );
    console.log('Fetched doctor:', rows[0]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching doctor details' });
  }
});

const fetchHospitals = async () => {
  try {
    const response = await axios.get('https://indian-hospitals.p.rapidapi.com/hospitals/Pune', { // Replace with the actual API endpoint
      headers: {
        'x-rapidapi-host': 'indian-hospitals.p.rapidapi.com', // Replace with the actual RapidAPI host
        'x-rapidapi-key': '278363d9admsha3d1143c2acfbcbp13854bjsn9dc90a2936cb',   // Replace with your RapidAPI key
      },
    });
    console.log('Hospital Details:', response.data); // Print the response data to the console
  } catch (error) {
    console.error('Error fetching hospital details:', error.message);
  }
};

fetchHospitals();

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});