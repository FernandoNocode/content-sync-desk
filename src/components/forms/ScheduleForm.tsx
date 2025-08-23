import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Video, Canal } from '@/contexts/AppContext';

interface ScheduleFormProps {
  video: Video;
  canal: Canal;
  onSubmit: (data: Date, hora: string) => void;
  onCancel: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ video, canal, onSubmit, onCancel }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(canal.horarios_postagem[0] || '09:00');

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayIndex = date.getDay();
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[dayIndex];
      
      if (canal.dias_postagem.includes(dayName)) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: `${date.toLocaleDateString('pt-BR')} (${dayName})`,
          date: date
        });
      }
    }
    
    return dates;
  };

  const availableDates = getNextAvailableDates();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    const date = new Date(selectedDate);
    onSubmit(date, selectedTime);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-primary p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Agendar Vídeo</h2>
          <button onClick={onCancel} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-1">{video.titulo}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-3 h-3 rounded-full bg-${canal.cor}`}></div>
            <span>{video.canal_nome}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Data de Publicação
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-primary w-full"
              required
            >
              <option value="">Selecione uma data...</option>
              {availableDates.map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Horário
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input-primary w-full"
            >
              {canal.horarios_postagem.map(horario => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="text-sm text-primary">
              <strong>Dias de postagem:</strong> {canal.dias_postagem.join(', ')}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Agendar Vídeo
            </button>
            <button type="button" onClick={onCancel} className="btn-ghost flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};