package com.gikundiro.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.gikundiro.app.plugins.SmsReaderPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Register custom plugins
    registerPlugin(SmsReaderPlugin.class);
  }
}
