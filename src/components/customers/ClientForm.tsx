import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  phone: z.string().optional(),
  address: z.string().min(1, 'Client address is required').max(500),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().max(1000).optional()
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onSuccess?: (client: any) => void;
  onCancel?: () => void;
  clientData?: any;
  isEditing?: boolean;
}

export function ClientForm({
  onSuccess,
  onCancel,
  clientData,
  isEditing = false
}: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: clientData?.name || '',
      phone: clientData?.phone || '',
      address: clientData?.address || '',
      email: clientData?.email || '',
      notes: clientData?.notes || ''
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const submissionData = {
        name: data.name,
        phone: data.phone || null,
        address: data.address,
        email: data.email || null,
        notes: data.notes || null,
        user_id: user.id
      };

      let result, error;
      if (isEditing && clientData?.id) {
        const response = await supabase
          .from('clients')
          .update(submissionData)
          .eq('id', clientData.id)
          .select()
          .single();
        result = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('clients')
          .insert(submissionData)
          .select()
          .single();
        result = response.data;
        error = response.error;
      }

      if (error) throw error;

      toast({
        title: isEditing ? 'Client updated successfully' : 'Client created successfully',
        description: isEditing 
          ? 'The client details have been updated.' 
          : 'You can now create jobs for this client.'
      });

      form.reset();
      onSuccess?.(result);
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Error saving client',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter client name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter client address" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes about this client" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
