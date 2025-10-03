import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

console.log('Set-ExecutionPolicy Restricted -Scope LocalMachine -Force')
console.log('Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root -norestart')

