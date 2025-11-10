package com.gikundiro.app.plugins;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

/**
 * SMS Reader Plugin for reading mobile money payment SMS messages
 */
@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_SMS }, alias = "sms")
    }
)
public class SmsReaderPlugin extends Plugin {

    private static final String PERMISSION_ALIAS = "sms";

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (hasRequiredPermissions()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        } else {
            requestPermissionForAlias(PERMISSION_ALIAS, call, "permissionCallback");
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasRequiredPermissions());
        call.resolve(result);
    }

    @PluginMethod
    public void readSms(PluginCall call) {
        if (!hasRequiredPermissions()) {
            call.reject("SMS read permission not granted");
            return;
        }

        Integer maxCount = call.getInt("maxCount", 50);
        String address = call.getString("address");
        Long minDate = call.getLong("minDate");

        try {
            List<JSObject> messages = readSmsMessages(maxCount, address, minDate);
            JSObject result = new JSObject();
            JSArray messagesArray = new JSArray();
            for (JSObject message : messages) {
                messagesArray.put(message);
            }
            result.put("messages", messagesArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to read SMS messages", e);
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        // For now, return not implemented
        // Real implementation would require a BroadcastReceiver for SMS_RECEIVED
        call.reject("SMS listening not yet implemented");
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    /**
     * Permission callback handler
     */
    @PluginMethod
    public void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasRequiredPermissions());
        call.resolve(result);
    }

    /**
     * Read SMS messages from the device inbox
     */
    private List<JSObject> readSmsMessages(int maxCount, String filterAddress, Long minDate) {
        List<JSObject> messages = new ArrayList<>();
        ContentResolver contentResolver = getContext().getContentResolver();
        
        Uri uri = Telephony.Sms.Inbox.CONTENT_URI;
        String[] projection = new String[] {
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE,
            Telephony.Sms.READ
        };

        // Build selection criteria
        StringBuilder selection = new StringBuilder();
        List<String> selectionArgs = new ArrayList<>();

        if (filterAddress != null && !filterAddress.isEmpty()) {
            selection.append(Telephony.Sms.ADDRESS + " = ?");
            selectionArgs.add(filterAddress);
        }

        if (minDate != null) {
            if (selection.length() > 0) {
                selection.append(" AND ");
            }
            selection.append(Telephony.Sms.DATE + " >= ?");
            selectionArgs.add(String.valueOf(minDate));
        }

        String selectionString = selection.length() > 0 ? selection.toString() : null;
        String[] selectionArgsArray = selectionArgs.size() > 0 
            ? selectionArgs.toArray(new String[0]) 
            : null;

        // Query SMS inbox
        Cursor cursor = contentResolver.query(
            uri,
            projection,
            selectionString,
            selectionArgsArray,
            Telephony.Sms.DATE + " DESC"
        );

        if (cursor != null) {
            int count = 0;
            while (cursor.moveToNext() && count < maxCount) {
                try {
                    JSObject message = new JSObject();
                    message.put("id", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms._ID)));
                    message.put("address", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)));
                    message.put("body", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)));
                    message.put("date", cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)));
                    message.put("read", cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Sms.READ)) == 1);
                    
                    messages.add(message);
                    count++;
                } catch (JSONException e) {
                    // Skip this message and continue
                }
            }
            cursor.close();
        }

        return messages;
    }
}
