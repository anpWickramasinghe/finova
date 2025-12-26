import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import React from 'react';

export function TabsDisabled() {
  const primary = useColor('primary');

  return (
    <Tabs defaultValue='available'
      style={{
        width: '100%',


      }}>
      <TabsList
        style={{
          backgroundColor: 'transparent',
          marginBottom: 16,

        }}
      >
        <TabsTrigger
          value='available'
          style={{ borderRadius: 0, backgroundColor: 'transparent' }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: 'transparent'
          }}
        >
          Pending
        </TabsTrigger>
        <TabsTrigger
          value='pending'
          style={{ borderRadius: 0, backgroundColor: 'transparent' }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: 'transparent'
          }}
        >
          Approved
        </TabsTrigger>
        <TabsTrigger
          value='premium'
          style={{ borderRadius: 0, backgroundColor: 'transparent' }}
          activeStyle={{
            borderBottomWidth: 2,
            borderBottomColor: primary,
            backgroundColor: 'transparent'
          }}
        >
          Reject
        </TabsTrigger>
        {/* <TabsTrigger value='enterprise' disabled>
          Enterprise
        </TabsTrigger> */}
      </TabsList>

      <TabsContent value='available'>
        <View style={{ padding: 10 }}>
          <Text variant='title' style={{ marginBottom: 8 }}>
            Available Features
          </Text>
          <Text variant='body'>
            These features are currently available to you.
          </Text>
        </View>
      </TabsContent>

      <TabsContent value='pending'>
        <View style={{ padding: 16 }}>
          <Text variant='title' style={{ marginBottom: 8 }}>
            Pending Features
          </Text>
          <Text variant='body'>
            These features are being processed and will be available soon.
          </Text>
        </View>
      </TabsContent>

      <TabsContent value='premium'>
        <View style={{ padding: 16 }}>
          <Text variant='title' style={{ marginBottom: 8 }}>
            Premium Features
          </Text>
          <Text variant='body'>Upgrade to access premium features.</Text>
        </View>
      </TabsContent>

      <TabsContent value='enterprise'>
        <View style={{ padding: 16 }}>
          <Text variant='title' style={{ marginBottom: 8 }}>
            Enterprise Features
          </Text>
          <Text variant='body'>Contact sales for enterprise features.</Text>
        </View>
      </TabsContent>
    </Tabs>
  );
}
