import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, User } from 'lucide-react';
import { ClientForm } from '@/components/customers/ClientForm';
const jobSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().min(1, 'Client name is required').max(100),
  client_phone: z.string().optional(),
  client_address: z.string().min(1, 'Client address is required').max(500),
  job_type: z.enum(['plumbing', 'electrical', 'heating', 'roofing', 'painting', 'other', 'construction', 'flooring', 'kitchen_fitting', 'bathroom_fitting']),
  custom_job_type: z.string().optional(),
  job_description: z.string().max(1000).optional(),
  contract_value: z.number().min(0).optional(),
  start_date: z.string().optional(),
  completion_date: z.string().optional()
});
type JobFormData = z.infer<typeof jobSchema>;
interface JobFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  jobData?: any;
  isEditing?: boolean;
}
interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string;
  email: string | null;
}

export function JobForm({
  onSuccess,
  onCancel,
  jobData,
  isEditing = false
}: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomJobType, setShowCustomJobType] = useState(jobData?.job_type === 'other' || false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [existingClientMessage, setExistingClientMessage] = useState<string>('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      client_id: jobData?.client_id || '',
      client_name: jobData?.client_name || '',
      client_phone: jobData?.client_phone || '',
      client_address: jobData?.client_address || '',
      job_type: jobData?.job_type || 'other',
      custom_job_type: jobData?.custom_job_type || '',
      job_description: jobData?.job_description || '',
      contract_value: jobData?.contract_value || 0,
      start_date: jobData?.start_date || '',
      completion_date: jobData?.completion_date || ''
    }
  });
  const watchJobType = form.watch("job_type");
  const watchClientId = form.watch("client_id");

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Show custom job type field when "other" is selected
  React.useEffect(() => {
    setShowCustomJobType(watchJobType === 'other');
    if (watchJobType !== 'other') {
      form.setValue('custom_job_type', '');
    }
  }, [watchJobType, form]);

  // Update form fields when client is selected
  React.useEffect(() => {
    if (watchClientId && watchClientId !== 'new') {
      const selectedClient = clients.find(client => client.id === watchClientId);
      if (selectedClient) {
        setIsAutoFilling(true);
        form.setValue('client_name', selectedClient.name, { shouldValidate: false, shouldDirty: false });
        form.setValue('client_phone', selectedClient.phone || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('client_address', selectedClient.address, { shouldValidate: false, shouldDirty: false });
        
        // Clear any existing errors for these fields
        form.clearErrors(['client_name', 'client_phone', 'client_address']);
        setExistingClientMessage(''); // Clear message when client is selected
        
        // Reset the auto-filling flag after a short delay
        setTimeout(() => setIsAutoFilling(false), 100);
      }
    }
  }, [watchClientId, clients, form]);

  // Watch client name for auto-selection
  const watchClientName = form.watch("client_name");

  // Auto-select client if name matches existing client (with debounce)
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const currentClientId = form.getValues('client_id');
      
      if (watchClientName && !currentClientId) {
        // First check local clients
        const matchingClient = clients.find(client => 
          client.name.toLowerCase() === watchClientName.toLowerCase()
        );
        
        if (matchingClient) {
          setIsAutoFilling(true);
          form.setValue('client_id', matchingClient.id, { shouldValidate: false, shouldDirty: false });
          form.setValue('client_phone', matchingClient.phone || '', { shouldValidate: false, shouldDirty: false });
          form.setValue('client_address', matchingClient.address, { shouldValidate: false, shouldDirty: false });
          form.clearErrors(['client_name', 'client_phone', 'client_address']);
          setExistingClientMessage('');
          
          // Reset the auto-filling flag after a short delay
          setTimeout(() => setIsAutoFilling(false), 100);
        } else {
          // Check if client exists in database
          const existingClient = await checkExistingClient(watchClientName);
          if (existingClient) {
            setExistingClientMessage(`Client "${watchClientName}" already exists. Please select it from the dropdown or choose a different name.`);
          } else {
            setExistingClientMessage('');
          }
        }
      } else {
        setExistingClientMessage('');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [watchClientName, clients, form]);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleClientCreated = (newClient: Client) => {
    setClients([...clients, newClient]);
    form.setValue('client_id', newClient.id, { shouldValidate: false, shouldDirty: false });
    form.clearErrors(['client_id']);
    setIsCreateClientDialogOpen(false);
  };

  const checkExistingClient = async (clientName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, name, phone, address')
        .eq('user_id', user.id)
        .eq('name', clientName)
        .single();

      return existingClient;
    } catch (error) {
      return null;
    }
  };
  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let clientId = data.client_id;

      // If no client is selected or "new" is selected, check if client exists or create new one
      if (!clientId || clientId === 'new') {
        // First, check if a client with this name already exists
        const existingClient = await checkExistingClient(data.client_name);

        if (existingClient) {
          // Client already exists, use the existing ID
          clientId = existingClient.id;
        } else {
          // Client doesn't exist, create a new one
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: data.client_name,
              phone: data.client_phone || null,
              address: data.client_address,
              email: null,
              notes: null,
              user_id: user.id
            })
            .select()
            .single();

          if (clientError) {
            // If it's a unique constraint violation, try to fetch the existing client
            if (clientError.code === '23505') {
              const existingClientRetry = await checkExistingClient(data.client_name);
              if (existingClientRetry) {
                clientId = existingClientRetry.id;
              } else {
                throw new Error('A client with this name already exists. Please select the existing client or choose a different name.');
              }
            } else {
              throw clientError;
            }
          } else {
            clientId = newClient.id;
          }
        }
      }

      const submissionData = {
        client_id: clientId,
        client_name: data.client_name,
        client_phone: data.client_phone || null,
        client_address: data.client_address,
        job_type: data.job_type,
        custom_job_type: data.job_type === 'other' ? data.custom_job_type : null,
        job_description: data.job_description || null,
        user_id: user.id,
        contract_value: data.contract_value > 0 ? data.contract_value : null,
        start_date: data.start_date || null,
        completion_date: data.completion_date || null
      };

      let error;
      if (isEditing && jobData?.id) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(submissionData)
          .eq('id', jobData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('jobs')
          .insert(submissionData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: isEditing ? 'Job updated successfully' : 'Job created successfully',
        description: isEditing 
          ? 'The job details have been updated.' 
          : 'You can now start capturing evidence for this job.'
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error creating job',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? 'Edit Job' : 'Create New Job'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing client or create new" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">+ Create New Client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <ClientForm onSuccess={handleClientCreated} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                  {existingClientMessage && (
                    <p className="text-sm text-amber-600 mt-1">{existingClientMessage}</p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="client_name" render={({
              field
            }) => <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="client_phone" render={({
              field
            }) => <FormItem>
                    <FormLabel>Client Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <FormField control={form.control} name="client_address" render={({
            field
          }) => <FormItem>
                  <FormLabel>Client Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="job_type" render={({
              field
            }) => <FormItem>
                    <FormLabel>Job Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="heating">Heating</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="flooring">Flooring</SelectItem>
                        <SelectItem value="kitchen_fitting">Kitchen Fitting</SelectItem>
                        <SelectItem value="bathroom_fitting">Bathroom Fitting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {showCustomJobType && <FormField control={form.control} name="custom_job_type" render={({
              field
            }) => <FormItem>
                      <FormLabel>Custom Job Type *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your job type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />}

              <FormField control={form.control} name="contract_value" render={({
              field
            }) => <FormItem>
                    <FormLabel>Contract Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={field.value || ''} 
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({
              field
            }) => <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="completion_date" render={({
              field
            }) => <FormItem>
                    <FormLabel>Estimated Completion Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <FormField control={form.control} name="job_description" render={({
            field
          }) => <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the work to be performed..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Job' : 'Create Job'}
              </Button>
              {onCancel && <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}