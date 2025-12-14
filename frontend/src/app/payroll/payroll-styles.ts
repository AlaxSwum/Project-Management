// Minimalist payroll form styles matching the design aesthetic
// Light beige background (#F5F5ED) with dark blue accents (#1e293b)

export const payrollStyles = {
  background: '#F5F5ED',
  primary: '#1e293b',
  secondary: '#64748b',
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  
  inputFocus: {
    borderColor: '#1e293b',
    boxShadow: '0 0 0 3px rgba(30, 41, 59, 0.1)',
  },
  
  inputHover: {
    borderColor: '#cbd5e1',
  },
  
  inputReadOnly: {
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontWeight: '600',
  },
  
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '8px',
  },
  
  button: {
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  buttonPrimary: {
    backgroundColor: '#1e293b',
    color: '#F5F5ED',
  },
  
  buttonPrimaryHover: {
    backgroundColor: '#0f172a',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)',
  },
  
  buttonSecondary: {
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
  },
  
  buttonSecondaryHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #e2e8f0',
  },
  
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '24px',
  },
  
  divider: {
    borderTop: '1px solid #e2e8f0',
    marginTop: '24px',
    paddingTop: '24px',
  },
};

