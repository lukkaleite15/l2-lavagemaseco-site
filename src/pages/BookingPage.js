import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Car, CheckCircle } from 'lucide-react';

// Componentes visuais integrados para evitar erros de pasta
const Button = ({ children, className = '', ...props }) => (
  <button className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6 ${className}`} {...props}>
    {children}
  </button>
);

const Input = ({ className = '', ...props }) => (
  <input className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${className}`} {...props} />
);

const Select = ({ className = '', children, ...props }) => (
  <select className={`mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${className}`} {...props}>
    {children}
  </select>
);

export default function BookingPage() {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', service: 'lavagem-simples' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Agendamento L2 Lavagem a Seco</h2>
          <p className="mt-2 text-sm text-gray-600">Escolha o melhor horário para cuidar do seu veículo</p>
        </div>

        {success ? (
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-3 text-lg font-medium text-green-900">Agendamento Solicitado!</h3>
            <p className="mt-2 text-sm text-green-700">Entraremos em contato em breve para confirmar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} /> Nome Completo
              </label>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={16} /> Telefone / WhatsApp
              </label>
              <Input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Car size={16} /> Tipo de Serviço
              </label>
              <Select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                <option value="lavagem-simples">Lavagem Ecológica Simples</option>
                <option value="lavagem-completa">Lavagem a Seco Completa + Higienização</option>
                <option value="polimento">Polimento Comercial</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={16} /> Data
                </label>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock size={16} /> Horário
                </label>
                <Input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit">
              Confirmar Agendamento
            </Button>
          </form>
        )}
      </div>
    </div>
  );
    }
                  
