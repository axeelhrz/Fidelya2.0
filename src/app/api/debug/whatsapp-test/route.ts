import { NextRequest, NextResponse } from 'next/server';
import { greenAPIService } from '@/services/green-api.service';
import { callMeBotService } from '@/services/callmebot.service';
import { freeWhatsAppService } from '@/services/free-whatsapp.service';
import { validateAndFormatPhone } from '@/utils/phone-validator';

/**
 * DEBUG ENDPOINT - Prueba de envío de WhatsApp
 * 
 * Uso:
 * POST /api/debug/whatsapp-test
 * {
 *   "phone": "1112345678",
 *   "message": "Mensaje de prueba",
 *   "title": "Prueba",
 *   "provider": "green-api" | "callmebot" | "all"
 * }
 */

interface TestRequest {
  phone: string;
  message: string;
  title?: string;
  provider?: 'green-api' | 'callmebot' | 'all';
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message, title, provider = 'all' }: TestRequest = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teléfono y mensaje son requeridos'
        },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(80));
    console.log('🧪 INICIANDO TEST DE WHATSAPP');
    console.log('='.repeat(80));

    // Paso 1: Validar número
    console.log('\n📋 PASO 1: Validando número de teléfono');
    console.log('-'.repeat(80));
    
    const validation = validateAndFormatPhone(phone);
    
    console.log(`Número original: ${phone}`);
    console.log(`Válido: ${validation.isValid}`);
    console.log(`Número formateado: ${validation.formatted}`);
    if (validation.error) {
      console.log(`Error: ${validation.error}`);
    }

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número de teléfono inválido',
          details: validation.error,
          validation
        },
        { status: 400 }
      );
    }

    // Paso 2: Verificar configuración de proveedores
    console.log('\n📋 PASO 2: Verificando configuración de proveedores');
    console.log('-'.repeat(80));

    const greenAPIConfig = greenAPIService.getConfig();
    const greenAPIConfigured = greenAPIService.isConfigured();
    const callMeBotConfigured = callMeBotService.isConfigured();

    console.log(`Green API configurado: ${greenAPIConfigured}`);
    if (greenAPIConfigured) {
      console.log(`  - Instance ID: ${greenAPIConfig.instanceId}`);
      console.log(`  - Base URL: ${greenAPIConfig.baseUrl}`);
    }
    console.log(`CallMeBot configurado: ${callMeBotConfigured}`);

    // Paso 3: Obtener estado de proveedores
    console.log('\n📋 PASO 3: Obteniendo estado de proveedores');
    console.log('-'.repeat(80));

    const providers = await freeWhatsAppService.getAvailableProviders();
    console.log('Proveedores disponibles:');
    providers.forEach(p => {
      console.log(`  - ${p.name}`);
      console.log(`    Configurado: ${p.configured}`);
      console.log(`    Disponible: ${p.available}`);
      console.log(`    Estado: ${p.status}`);
      console.log(`    Costo: ${p.cost}`);
    });

    // Paso 4: Enviar mensaje
    console.log('\n📋 PASO 4: Enviando mensaje');
    console.log('-'.repeat(80));

    const results: Record<string, unknown> = {};

    if (provider === 'green-api' || provider === 'all') {
      console.log('\n🟢 Intentando con Green API...');
      const greenResult = await greenAPIService.sendMessage(
        phone,
        message,
        title
      );
      results['green-api'] = greenResult;
      console.log(`Resultado: ${greenResult.success ? '✅ ÉXITO' : '❌ FALLO'}`);
      if (greenResult.messageId) {
        console.log(`ID del mensaje: ${greenResult.messageId}`);
      }
      if (greenResult.error) {
        console.log(`Error: ${greenResult.error}`);
      }
    }

    if (provider === 'callmebot' || provider === 'all') {
      console.log('\n🟡 Intentando con CallMeBot...');
      const callMeBotResult = await callMeBotService.sendMessage(
        phone,
        message,
        title
      );
      results['callmebot'] = callMeBotResult;
      console.log(`Resultado: ${callMeBotResult.success ? '✅ ÉXITO' : '❌ FALLO'}`);
      if (callMeBotResult.messageId) {
        console.log(`ID del mensaje: ${callMeBotResult.messageId}`);
      }
      if (callMeBotResult.error) {
        console.log(`Error: ${callMeBotResult.error}`);
      }
    }

    if (provider === 'all') {
      console.log('\n🔵 Intentando con todos los proveedores (fallback)...');
      const allResult = await freeWhatsAppService.sendMessage(
        phone,
        message,
        title
      );
      results['all-providers'] = allResult;
      console.log(`Resultado: ${allResult.success ? '✅ ÉXITO' : '❌ FALLO'}`);
      console.log(`Proveedor usado: ${allResult.provider}`);
      if (allResult.messageId) {
        console.log(`ID del mensaje: ${allResult.messageId}`);
      }
      if (allResult.error) {
        console.log(`Error: ${allResult.error}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETADO');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      validation,
      providers,
      results,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('💥 Error en test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error en el test',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener información de configuración
 */
export async function GET() {
  try {
    console.log('\n📋 Obteniendo información de configuración...\n');

    const greenAPIConfig = greenAPIService.getConfig();
    const greenAPIConfigured = greenAPIService.isConfigured();
    const callMeBotConfigured = callMeBotService.isConfigured();
    const providers = await freeWhatsAppService.getAvailableProviders();

    // Verificar estado de Green API
    let greenAPIStatus = null;
    if (greenAPIConfigured) {
      greenAPIStatus = await greenAPIService.getInstanceStatus();
    }

    return NextResponse.json({
      success: true,
      configuration: {
        greenAPI: {
          configured: greenAPIConfigured,
          config: greenAPIConfig,
          status: greenAPIStatus
        },
        callMeBot: {
          configured: callMeBotConfigured
        },
        availableProviders: providers
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo configuración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}