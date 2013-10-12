package com.pingotea;

import android.os.Bundle;
import org.apache.cordova.DroidGap;

public class MainActivity extends DroidGap {

    /**
     * Called when the activity is first created.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Set by <content src="index.html" /> in config.xml
        super.loadUrl("file:///android_asset/www/main.html");
        //super.loadUrl("file:///android_asset/www/index.html");
    }
}
