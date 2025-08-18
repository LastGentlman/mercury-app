import { useState } from 'react';
import { DollarSign, Plus, Search, TrendingUp, User } from 'lucide-react';
import { Button } from './ui/index.ts'  ;
import { Input } from './ui/index.ts';
import { Card } from './ui/index.ts';
import { ClientCard } from './ClientCard.tsx';
import { CreateClientModal } from './CreateClientModal.tsx';
import { EditClientModal } from './EditClientModal.tsx';
import type { Client } from '../types/index.ts';
import { useClients } from '../hooks/useClients.ts';

export function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const {
    clients,
    isLoading,
    createClient: createClientMutation,
    updateClient: updateClientMutation,
    deleteClient,
    isCreating,
    isUpdating
  } = useClients();

  const createClient = (client: unknown) => {
    return Promise.resolve(createClientMutation(client as Client));
  };

  const updateClient = (client: unknown) => {
    return Promise.resolve(updateClientMutation(client as Partial<Client> & { id: string }));
  };

  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleDeleteClient = async (clientId: string) => {
    if (globalThis.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
      try {
        await deleteClient(clientId);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">{clients.length} clientes registrados</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar clientes por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${clients.reduce((acc: number, client: Client) => acc + client.total_spent, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pedidos Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.length > 0 ? (clients.reduce((acc: number, client: Client) => acc + client.total_orders, 0) / clients.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client: Client) => (
            <ClientCard 
              key={client.id}
              client={client}
              onEdit={() => setSelectedClient(client)}
              onDelete={() => handleDeleteClient(client.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredClients.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron clientes con ese criterio' : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createClient}
        isLoading={isCreating}
      />
      
      {selectedClient && (
        <EditClientModal
          client={selectedClient}
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={updateClient}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
} 