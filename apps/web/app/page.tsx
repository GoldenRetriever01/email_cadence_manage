"use client";

import { useState, useEffect } from "react";
import { Cadence, CadenceStep, EnrollmentStatus } from "../src/types";
import { createCadence, startEnrollment, getEnrollment, updateCadenceInFlight } from "../src/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"cadence" | "enroll" | "monitor">("cadence");
  const [cadenceJson, setCadenceJson] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Default cadence template
  useEffect(() => {
    const defaultCadence: Cadence = {
      id: "cad_welcome",
      name: "Welcome Flow",
      steps: [
        {
          id: "1",
          type: "SEND_EMAIL",
          subject: "Welcome",
          body: "Hello there",
        },
        {
          id: "2",
          type: "WAIT",
          seconds: 3,
        },
        {
          id: "3",
          type: "SEND_EMAIL",
          subject: "Follow up",
          body: "Checking in",
        },
      ],
    };
    setCadenceJson(JSON.stringify(defaultCadence, null, 2));
  }, []);

  const handleCreateCadence = async () => {
    setLoading(true);
    try {
      const cadence = JSON.parse(cadenceJson);
      await createCadence(cadence.id, cadence.name, cadence.steps);
      setMessage("✓ Cadence created successfully");
    } catch (error) {
      setMessage("✗ Failed to create cadence: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEnrollment = async () => {
    if (!enrollmentId || !contactEmail) {
      setMessage("✗ Please enter cadence ID and email");
      return;
    }

    setLoading(true);
    try {
      const result = await startEnrollment(enrollmentId, contactEmail) as any;
      setEnrollmentStatus(result);
      setMessage("✓ Enrollment started: " + result.id);
      setActiveTab("monitor");
    } catch (error) {
      setMessage("✗ Failed to start enrollment: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!enrollmentStatus?.id) {
      setMessage("✗ No enrollment to check");
      return;
    }

    try {
      const status = await getEnrollment(enrollmentStatus.id) as any;
      setEnrollmentStatus(status);
      setMessage("✓ Status updated");
    } catch (error) {
      setMessage("✗ Failed to get status: " + (error as Error).message);
    }
  };

  const handleUpdateCadence = async () => {
    if (!enrollmentStatus?.id) {
      setMessage("✗ No enrollment to update");
      return;
    }

    try {
      const cadence = JSON.parse(cadenceJson);
      await updateCadenceInFlight(enrollmentStatus.id, cadence.steps);
      setMessage("✓ Cadence update signal sent");
    } catch (error) {
      setMessage("✗ Failed to update cadence: " + (error as Error).message);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Email Cadence Manager</h1>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("cadence")}
          style={{
            ...styles.tabButton,
            background: activeTab === "cadence" ? "#007bff" : "#ddd",
          }}
        >
          Create Cadence
        </button>
        <button
          onClick={() => setActiveTab("enroll")}
          style={{
            ...styles.tabButton,
            background: activeTab === "enroll" ? "#007bff" : "#ddd",
          }}
        >
          Enroll Contact
        </button>
        <button
          onClick={() => setActiveTab("monitor")}
          style={{
            ...styles.tabButton,
            background: activeTab === "monitor" ? "#007bff" : "#ddd",
          }}
        >
          Monitor & Update
        </button>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            background: message.includes("✓") ? "#d4edda" : "#f8d7da",
            color: message.includes("✓") ? "#155724" : "#721c24",
          }}
        >
          {message}
        </div>
      )}

      {activeTab === "cadence" && (
        <div style={styles.section}>
          <h2>Create / Edit Cadence</h2>
          <label>Cadence JSON:</label>
          <textarea
            value={cadenceJson}
            onChange={(e: any) => setCadenceJson(e.target.value)}
            style={styles.textarea}
            rows={15}
          />
          <button onClick={handleCreateCadence} disabled={loading} style={styles.button}>
            {loading ? "Creating..." : "Create Cadence"}
          </button>
        </div>
      )}

      {activeTab === "enroll" && (
        <div style={styles.section}>
          <h2>Enroll Contact</h2>
          <div style={styles.formGroup}>
            <label>Cadence ID:</label>
            <input
              type="text"
              value={enrollmentId}
              onChange={(e: any) => setEnrollmentId(e.target.value)}
              placeholder="e.g., cad_welcome"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Contact Email:</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e: any) => setContactEmail(e.target.value)}
              placeholder="e.g., user@example.com"
              style={styles.input}
            />
          </div>
          <button onClick={handleStartEnrollment} disabled={loading} style={styles.button}>
            {loading ? "Starting..." : "Start Enrollment"}
          </button>
        </div>
      )}

      {activeTab === "monitor" && (
        <div style={styles.section}>
          <h2>Monitor & Update Workflow</h2>
          {enrollmentStatus ? (
            <>
              <div style={styles.statusBox}>
                <p>
                  <strong>Enrollment ID:</strong> {enrollmentStatus.id}
                </p>
                <p>
                  <strong>Status:</strong> {enrollmentStatus.status}
                </p>
                <p>
                  <strong>Current Step:</strong> {enrollmentStatus.currentStepIndex}
                </p>
                <p>
                  <strong>Steps Version:</strong> {enrollmentStatus.stepsVersion}
                </p>
                <p>
                  <strong>Email:</strong> {enrollmentStatus.contactEmail}
                </p>
              </div>

              <div style={styles.buttonGroup}>
                <button onClick={handleCheckStatus} style={styles.button}>
                  Refresh Status
                </button>
              </div>

              <h3>Update Cadence In-Flight</h3>
              <label>Updated Steps JSON:</label>
              <textarea
                value={cadenceJson}
                onChange={(e: any) => setCadenceJson(e.target.value)}
                style={styles.textarea}
                rows={10}
              />
              <button onClick={handleUpdateCadence} style={styles.button}>
                Send Update Signal
              </button>
            </>
          ) : (
            <p style={{ color: "#999" }}>No active enrollment. Start one from the "Enroll Contact" tab.</p>
          )}
        </div>
      )}

      </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    background: "white",
    minHeight: "100vh",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "2px solid #ddd",
  },
  tabButton: {
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
    color: "white",
    borderRadius: "4px 4px 0 0",
    fontSize: "14px",
    fontWeight: "500",
  },
  section: {
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontFamily: "monospace",
    fontSize: "12px",
    boxSizing: "border-box" as const,
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box" as const,
    marginTop: "4px",
  },
  button: {
    padding: "10px 20px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  buttonGroup: {
    marginBottom: "20px",
  },
  statusBox: {
    padding: "16px",
    background: "#f0f0f0",
    borderRadius: "4px",
    marginBottom: "16px",
    fontFamily: "monospace",
    fontSize: "13px",
  },
};
