drop trigger if exists "trg_rewards_on_transactions" on "public"."transactions";

drop policy "community_posts_owner" on "public"."community_posts";

drop policy "p_community_posts_public_read" on "public"."community_posts";

drop policy "orders_owner" on "public"."orders";

drop policy "sacco_deposits_owner" on "public"."sacco_deposits";

drop policy "ticket_orders_owner" on "public"."ticket_orders";

drop policy "p_users_public_profiles" on "public"."users";

revoke delete on table "public"."admin_permissions" from "anon";

revoke insert on table "public"."admin_permissions" from "anon";

revoke references on table "public"."admin_permissions" from "anon";

revoke select on table "public"."admin_permissions" from "anon";

revoke trigger on table "public"."admin_permissions" from "anon";

revoke truncate on table "public"."admin_permissions" from "anon";

revoke update on table "public"."admin_permissions" from "anon";

revoke delete on table "public"."admin_permissions" from "authenticated";

revoke insert on table "public"."admin_permissions" from "authenticated";

revoke references on table "public"."admin_permissions" from "authenticated";

revoke select on table "public"."admin_permissions" from "authenticated";

revoke trigger on table "public"."admin_permissions" from "authenticated";

revoke truncate on table "public"."admin_permissions" from "authenticated";

revoke update on table "public"."admin_permissions" from "authenticated";

revoke delete on table "public"."admin_permissions" from "service_role";

revoke insert on table "public"."admin_permissions" from "service_role";

revoke references on table "public"."admin_permissions" from "service_role";

revoke select on table "public"."admin_permissions" from "service_role";

revoke trigger on table "public"."admin_permissions" from "service_role";

revoke truncate on table "public"."admin_permissions" from "service_role";

revoke update on table "public"."admin_permissions" from "service_role";

revoke delete on table "public"."admin_role_permissions" from "anon";

revoke insert on table "public"."admin_role_permissions" from "anon";

revoke references on table "public"."admin_role_permissions" from "anon";

revoke select on table "public"."admin_role_permissions" from "anon";

revoke trigger on table "public"."admin_role_permissions" from "anon";

revoke truncate on table "public"."admin_role_permissions" from "anon";

revoke update on table "public"."admin_role_permissions" from "anon";

revoke delete on table "public"."admin_role_permissions" from "authenticated";

revoke insert on table "public"."admin_role_permissions" from "authenticated";

revoke references on table "public"."admin_role_permissions" from "authenticated";

revoke select on table "public"."admin_role_permissions" from "authenticated";

revoke trigger on table "public"."admin_role_permissions" from "authenticated";

revoke truncate on table "public"."admin_role_permissions" from "authenticated";

revoke update on table "public"."admin_role_permissions" from "authenticated";

revoke delete on table "public"."admin_role_permissions" from "service_role";

revoke insert on table "public"."admin_role_permissions" from "service_role";

revoke references on table "public"."admin_role_permissions" from "service_role";

revoke select on table "public"."admin_role_permissions" from "service_role";

revoke trigger on table "public"."admin_role_permissions" from "service_role";

revoke truncate on table "public"."admin_role_permissions" from "service_role";

revoke update on table "public"."admin_role_permissions" from "service_role";

revoke delete on table "public"."admin_roles" from "anon";

revoke insert on table "public"."admin_roles" from "anon";

revoke references on table "public"."admin_roles" from "anon";

revoke select on table "public"."admin_roles" from "anon";

revoke trigger on table "public"."admin_roles" from "anon";

revoke truncate on table "public"."admin_roles" from "anon";

revoke update on table "public"."admin_roles" from "anon";

revoke delete on table "public"."admin_roles" from "authenticated";

revoke insert on table "public"."admin_roles" from "authenticated";

revoke references on table "public"."admin_roles" from "authenticated";

revoke select on table "public"."admin_roles" from "authenticated";

revoke trigger on table "public"."admin_roles" from "authenticated";

revoke truncate on table "public"."admin_roles" from "authenticated";

revoke update on table "public"."admin_roles" from "authenticated";

revoke delete on table "public"."admin_roles" from "service_role";

revoke insert on table "public"."admin_roles" from "service_role";

revoke references on table "public"."admin_roles" from "service_role";

revoke select on table "public"."admin_roles" from "service_role";

revoke trigger on table "public"."admin_roles" from "service_role";

revoke truncate on table "public"."admin_roles" from "service_role";

revoke update on table "public"."admin_roles" from "service_role";

revoke delete on table "public"."admin_sessions" from "anon";

revoke insert on table "public"."admin_sessions" from "anon";

revoke references on table "public"."admin_sessions" from "anon";

revoke select on table "public"."admin_sessions" from "anon";

revoke trigger on table "public"."admin_sessions" from "anon";

revoke truncate on table "public"."admin_sessions" from "anon";

revoke update on table "public"."admin_sessions" from "anon";

revoke delete on table "public"."admin_sessions" from "authenticated";

revoke insert on table "public"."admin_sessions" from "authenticated";

revoke references on table "public"."admin_sessions" from "authenticated";

revoke select on table "public"."admin_sessions" from "authenticated";

revoke trigger on table "public"."admin_sessions" from "authenticated";

revoke truncate on table "public"."admin_sessions" from "authenticated";

revoke update on table "public"."admin_sessions" from "authenticated";

revoke delete on table "public"."admin_sessions" from "service_role";

revoke insert on table "public"."admin_sessions" from "service_role";

revoke references on table "public"."admin_sessions" from "service_role";

revoke select on table "public"."admin_sessions" from "service_role";

revoke trigger on table "public"."admin_sessions" from "service_role";

revoke truncate on table "public"."admin_sessions" from "service_role";

revoke update on table "public"."admin_sessions" from "service_role";

revoke delete on table "public"."admin_user_roles" from "anon";

revoke insert on table "public"."admin_user_roles" from "anon";

revoke references on table "public"."admin_user_roles" from "anon";

revoke select on table "public"."admin_user_roles" from "anon";

revoke trigger on table "public"."admin_user_roles" from "anon";

revoke truncate on table "public"."admin_user_roles" from "anon";

revoke update on table "public"."admin_user_roles" from "anon";

revoke delete on table "public"."admin_user_roles" from "authenticated";

revoke insert on table "public"."admin_user_roles" from "authenticated";

revoke references on table "public"."admin_user_roles" from "authenticated";

revoke select on table "public"."admin_user_roles" from "authenticated";

revoke trigger on table "public"."admin_user_roles" from "authenticated";

revoke truncate on table "public"."admin_user_roles" from "authenticated";

revoke update on table "public"."admin_user_roles" from "authenticated";

revoke delete on table "public"."admin_user_roles" from "service_role";

revoke insert on table "public"."admin_user_roles" from "service_role";

revoke references on table "public"."admin_user_roles" from "service_role";

revoke select on table "public"."admin_user_roles" from "service_role";

revoke trigger on table "public"."admin_user_roles" from "service_role";

revoke truncate on table "public"."admin_user_roles" from "service_role";

revoke update on table "public"."admin_user_roles" from "service_role";

revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke select on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

revoke delete on table "public"."admin_users" from "service_role";

revoke insert on table "public"."admin_users" from "service_role";

revoke references on table "public"."admin_users" from "service_role";

revoke select on table "public"."admin_users" from "service_role";

revoke trigger on table "public"."admin_users" from "service_role";

revoke truncate on table "public"."admin_users" from "service_role";

revoke update on table "public"."admin_users" from "service_role";

revoke delete on table "public"."admin_users_roles" from "anon";

revoke insert on table "public"."admin_users_roles" from "anon";

revoke references on table "public"."admin_users_roles" from "anon";

revoke select on table "public"."admin_users_roles" from "anon";

revoke trigger on table "public"."admin_users_roles" from "anon";

revoke truncate on table "public"."admin_users_roles" from "anon";

revoke update on table "public"."admin_users_roles" from "anon";

revoke delete on table "public"."admin_users_roles" from "authenticated";

revoke insert on table "public"."admin_users_roles" from "authenticated";

revoke references on table "public"."admin_users_roles" from "authenticated";

revoke select on table "public"."admin_users_roles" from "authenticated";

revoke trigger on table "public"."admin_users_roles" from "authenticated";

revoke truncate on table "public"."admin_users_roles" from "authenticated";

revoke update on table "public"."admin_users_roles" from "authenticated";

revoke delete on table "public"."admin_users_roles" from "service_role";

revoke insert on table "public"."admin_users_roles" from "service_role";

revoke references on table "public"."admin_users_roles" from "service_role";

revoke select on table "public"."admin_users_roles" from "service_role";

revoke trigger on table "public"."admin_users_roles" from "service_role";

revoke truncate on table "public"."admin_users_roles" from "service_role";

revoke update on table "public"."admin_users_roles" from "service_role";

revoke delete on table "public"."audit_logs" from "anon";

revoke insert on table "public"."audit_logs" from "anon";

revoke references on table "public"."audit_logs" from "anon";

revoke select on table "public"."audit_logs" from "anon";

revoke trigger on table "public"."audit_logs" from "anon";

revoke truncate on table "public"."audit_logs" from "anon";

revoke update on table "public"."audit_logs" from "anon";

revoke delete on table "public"."audit_logs" from "authenticated";

revoke insert on table "public"."audit_logs" from "authenticated";

revoke references on table "public"."audit_logs" from "authenticated";

revoke select on table "public"."audit_logs" from "authenticated";

revoke trigger on table "public"."audit_logs" from "authenticated";

revoke truncate on table "public"."audit_logs" from "authenticated";

revoke update on table "public"."audit_logs" from "authenticated";

revoke delete on table "public"."audit_logs" from "service_role";

revoke insert on table "public"."audit_logs" from "service_role";

revoke references on table "public"."audit_logs" from "service_role";

revoke select on table "public"."audit_logs" from "service_role";

revoke trigger on table "public"."audit_logs" from "service_role";

revoke truncate on table "public"."audit_logs" from "service_role";

revoke update on table "public"."audit_logs" from "service_role";

revoke delete on table "public"."community_posts" from "anon";

revoke insert on table "public"."community_posts" from "anon";

revoke references on table "public"."community_posts" from "anon";

revoke select on table "public"."community_posts" from "anon";

revoke trigger on table "public"."community_posts" from "anon";

revoke truncate on table "public"."community_posts" from "anon";

revoke update on table "public"."community_posts" from "anon";

revoke delete on table "public"."community_posts" from "authenticated";

revoke insert on table "public"."community_posts" from "authenticated";

revoke references on table "public"."community_posts" from "authenticated";

revoke select on table "public"."community_posts" from "authenticated";

revoke trigger on table "public"."community_posts" from "authenticated";

revoke truncate on table "public"."community_posts" from "authenticated";

revoke update on table "public"."community_posts" from "authenticated";

revoke delete on table "public"."community_posts" from "service_role";

revoke insert on table "public"."community_posts" from "service_role";

revoke references on table "public"."community_posts" from "service_role";

revoke select on table "public"."community_posts" from "service_role";

revoke trigger on table "public"."community_posts" from "service_role";

revoke truncate on table "public"."community_posts" from "service_role";

revoke update on table "public"."community_posts" from "service_role";

revoke delete on table "public"."community_reports" from "anon";

revoke insert on table "public"."community_reports" from "anon";

revoke references on table "public"."community_reports" from "anon";

revoke select on table "public"."community_reports" from "anon";

revoke trigger on table "public"."community_reports" from "anon";

revoke truncate on table "public"."community_reports" from "anon";

revoke update on table "public"."community_reports" from "anon";

revoke delete on table "public"."community_reports" from "authenticated";

revoke insert on table "public"."community_reports" from "authenticated";

revoke references on table "public"."community_reports" from "authenticated";

revoke select on table "public"."community_reports" from "authenticated";

revoke trigger on table "public"."community_reports" from "authenticated";

revoke truncate on table "public"."community_reports" from "authenticated";

revoke update on table "public"."community_reports" from "authenticated";

revoke delete on table "public"."community_reports" from "service_role";

revoke insert on table "public"."community_reports" from "service_role";

revoke references on table "public"."community_reports" from "service_role";

revoke select on table "public"."community_reports" from "service_role";

revoke trigger on table "public"."community_reports" from "service_role";

revoke truncate on table "public"."community_reports" from "service_role";

revoke update on table "public"."community_reports" from "service_role";

revoke delete on table "public"."content_items" from "anon";

revoke insert on table "public"."content_items" from "anon";

revoke references on table "public"."content_items" from "anon";

revoke select on table "public"."content_items" from "anon";

revoke trigger on table "public"."content_items" from "anon";

revoke truncate on table "public"."content_items" from "anon";

revoke update on table "public"."content_items" from "anon";

revoke delete on table "public"."content_items" from "authenticated";

revoke insert on table "public"."content_items" from "authenticated";

revoke references on table "public"."content_items" from "authenticated";

revoke select on table "public"."content_items" from "authenticated";

revoke trigger on table "public"."content_items" from "authenticated";

revoke truncate on table "public"."content_items" from "authenticated";

revoke update on table "public"."content_items" from "authenticated";

revoke delete on table "public"."content_items" from "service_role";

revoke insert on table "public"."content_items" from "service_role";

revoke references on table "public"."content_items" from "service_role";

revoke select on table "public"."content_items" from "service_role";

revoke trigger on table "public"."content_items" from "service_role";

revoke truncate on table "public"."content_items" from "service_role";

revoke update on table "public"."content_items" from "service_role";

revoke delete on table "public"."fan_clubs" from "anon";

revoke insert on table "public"."fan_clubs" from "anon";

revoke references on table "public"."fan_clubs" from "anon";

revoke select on table "public"."fan_clubs" from "anon";

revoke trigger on table "public"."fan_clubs" from "anon";

revoke truncate on table "public"."fan_clubs" from "anon";

revoke update on table "public"."fan_clubs" from "anon";

revoke delete on table "public"."fan_clubs" from "authenticated";

revoke insert on table "public"."fan_clubs" from "authenticated";

revoke references on table "public"."fan_clubs" from "authenticated";

revoke select on table "public"."fan_clubs" from "authenticated";

revoke trigger on table "public"."fan_clubs" from "authenticated";

revoke truncate on table "public"."fan_clubs" from "authenticated";

revoke update on table "public"."fan_clubs" from "authenticated";

revoke delete on table "public"."fan_clubs" from "service_role";

revoke insert on table "public"."fan_clubs" from "service_role";

revoke references on table "public"."fan_clubs" from "service_role";

revoke select on table "public"."fan_clubs" from "service_role";

revoke trigger on table "public"."fan_clubs" from "service_role";

revoke truncate on table "public"."fan_clubs" from "service_role";

revoke update on table "public"."fan_clubs" from "service_role";

revoke delete on table "public"."fan_posts" from "anon";

revoke insert on table "public"."fan_posts" from "anon";

revoke references on table "public"."fan_posts" from "anon";

revoke select on table "public"."fan_posts" from "anon";

revoke trigger on table "public"."fan_posts" from "anon";

revoke truncate on table "public"."fan_posts" from "anon";

revoke update on table "public"."fan_posts" from "anon";

revoke delete on table "public"."fan_posts" from "authenticated";

revoke insert on table "public"."fan_posts" from "authenticated";

revoke references on table "public"."fan_posts" from "authenticated";

revoke select on table "public"."fan_posts" from "authenticated";

revoke trigger on table "public"."fan_posts" from "authenticated";

revoke truncate on table "public"."fan_posts" from "authenticated";

revoke update on table "public"."fan_posts" from "authenticated";

revoke delete on table "public"."fan_posts" from "service_role";

revoke insert on table "public"."fan_posts" from "service_role";

revoke references on table "public"."fan_posts" from "service_role";

revoke select on table "public"."fan_posts" from "service_role";

revoke trigger on table "public"."fan_posts" from "service_role";

revoke truncate on table "public"."fan_posts" from "service_role";

revoke update on table "public"."fan_posts" from "service_role";

revoke delete on table "public"."feature_flags" from "anon";

revoke insert on table "public"."feature_flags" from "anon";

revoke references on table "public"."feature_flags" from "anon";

revoke select on table "public"."feature_flags" from "anon";

revoke trigger on table "public"."feature_flags" from "anon";

revoke truncate on table "public"."feature_flags" from "anon";

revoke update on table "public"."feature_flags" from "anon";

revoke delete on table "public"."feature_flags" from "authenticated";

revoke insert on table "public"."feature_flags" from "authenticated";

revoke references on table "public"."feature_flags" from "authenticated";

revoke select on table "public"."feature_flags" from "authenticated";

revoke trigger on table "public"."feature_flags" from "authenticated";

revoke truncate on table "public"."feature_flags" from "authenticated";

revoke update on table "public"."feature_flags" from "authenticated";

revoke delete on table "public"."feature_flags" from "service_role";

revoke insert on table "public"."feature_flags" from "service_role";

revoke references on table "public"."feature_flags" from "service_role";

revoke select on table "public"."feature_flags" from "service_role";

revoke trigger on table "public"."feature_flags" from "service_role";

revoke truncate on table "public"."feature_flags" from "service_role";

revoke update on table "public"."feature_flags" from "service_role";

revoke delete on table "public"."fund_donations" from "anon";

revoke insert on table "public"."fund_donations" from "anon";

revoke references on table "public"."fund_donations" from "anon";

revoke select on table "public"."fund_donations" from "anon";

revoke trigger on table "public"."fund_donations" from "anon";

revoke truncate on table "public"."fund_donations" from "anon";

revoke update on table "public"."fund_donations" from "anon";

revoke delete on table "public"."fund_donations" from "authenticated";

revoke insert on table "public"."fund_donations" from "authenticated";

revoke references on table "public"."fund_donations" from "authenticated";

revoke select on table "public"."fund_donations" from "authenticated";

revoke trigger on table "public"."fund_donations" from "authenticated";

revoke truncate on table "public"."fund_donations" from "authenticated";

revoke update on table "public"."fund_donations" from "authenticated";

revoke delete on table "public"."fund_donations" from "service_role";

revoke insert on table "public"."fund_donations" from "service_role";

revoke references on table "public"."fund_donations" from "service_role";

revoke select on table "public"."fund_donations" from "service_role";

revoke trigger on table "public"."fund_donations" from "service_role";

revoke truncate on table "public"."fund_donations" from "service_role";

revoke update on table "public"."fund_donations" from "service_role";

revoke delete on table "public"."fund_projects" from "anon";

revoke insert on table "public"."fund_projects" from "anon";

revoke references on table "public"."fund_projects" from "anon";

revoke select on table "public"."fund_projects" from "anon";

revoke trigger on table "public"."fund_projects" from "anon";

revoke truncate on table "public"."fund_projects" from "anon";

revoke update on table "public"."fund_projects" from "anon";

revoke delete on table "public"."fund_projects" from "authenticated";

revoke insert on table "public"."fund_projects" from "authenticated";

revoke references on table "public"."fund_projects" from "authenticated";

revoke select on table "public"."fund_projects" from "authenticated";

revoke trigger on table "public"."fund_projects" from "authenticated";

revoke truncate on table "public"."fund_projects" from "authenticated";

revoke update on table "public"."fund_projects" from "authenticated";

revoke delete on table "public"."fund_projects" from "service_role";

revoke insert on table "public"."fund_projects" from "service_role";

revoke references on table "public"."fund_projects" from "service_role";

revoke select on table "public"."fund_projects" from "service_role";

revoke trigger on table "public"."fund_projects" from "service_role";

revoke truncate on table "public"."fund_projects" from "service_role";

revoke update on table "public"."fund_projects" from "service_role";

revoke delete on table "public"."gamification_events" from "anon";

revoke insert on table "public"."gamification_events" from "anon";

revoke references on table "public"."gamification_events" from "anon";

revoke select on table "public"."gamification_events" from "anon";

revoke trigger on table "public"."gamification_events" from "anon";

revoke truncate on table "public"."gamification_events" from "anon";

revoke update on table "public"."gamification_events" from "anon";

revoke delete on table "public"."gamification_events" from "authenticated";

revoke insert on table "public"."gamification_events" from "authenticated";

revoke references on table "public"."gamification_events" from "authenticated";

revoke select on table "public"."gamification_events" from "authenticated";

revoke trigger on table "public"."gamification_events" from "authenticated";

revoke truncate on table "public"."gamification_events" from "authenticated";

revoke update on table "public"."gamification_events" from "authenticated";

revoke delete on table "public"."gamification_events" from "service_role";

revoke insert on table "public"."gamification_events" from "service_role";

revoke references on table "public"."gamification_events" from "service_role";

revoke select on table "public"."gamification_events" from "service_role";

revoke trigger on table "public"."gamification_events" from "service_role";

revoke truncate on table "public"."gamification_events" from "service_role";

revoke update on table "public"."gamification_events" from "service_role";

revoke delete on table "public"."insurance_quotes" from "anon";

revoke insert on table "public"."insurance_quotes" from "anon";

revoke references on table "public"."insurance_quotes" from "anon";

revoke select on table "public"."insurance_quotes" from "anon";

revoke trigger on table "public"."insurance_quotes" from "anon";

revoke truncate on table "public"."insurance_quotes" from "anon";

revoke update on table "public"."insurance_quotes" from "anon";

revoke delete on table "public"."insurance_quotes" from "authenticated";

revoke insert on table "public"."insurance_quotes" from "authenticated";

revoke references on table "public"."insurance_quotes" from "authenticated";

revoke select on table "public"."insurance_quotes" from "authenticated";

revoke trigger on table "public"."insurance_quotes" from "authenticated";

revoke truncate on table "public"."insurance_quotes" from "authenticated";

revoke update on table "public"."insurance_quotes" from "authenticated";

revoke delete on table "public"."insurance_quotes" from "service_role";

revoke insert on table "public"."insurance_quotes" from "service_role";

revoke references on table "public"."insurance_quotes" from "service_role";

revoke select on table "public"."insurance_quotes" from "service_role";

revoke trigger on table "public"."insurance_quotes" from "service_role";

revoke truncate on table "public"."insurance_quotes" from "service_role";

revoke update on table "public"."insurance_quotes" from "service_role";

revoke delete on table "public"."leaderboards" from "anon";

revoke insert on table "public"."leaderboards" from "anon";

revoke references on table "public"."leaderboards" from "anon";

revoke select on table "public"."leaderboards" from "anon";

revoke trigger on table "public"."leaderboards" from "anon";

revoke truncate on table "public"."leaderboards" from "anon";

revoke update on table "public"."leaderboards" from "anon";

revoke delete on table "public"."leaderboards" from "authenticated";

revoke insert on table "public"."leaderboards" from "authenticated";

revoke references on table "public"."leaderboards" from "authenticated";

revoke select on table "public"."leaderboards" from "authenticated";

revoke trigger on table "public"."leaderboards" from "authenticated";

revoke truncate on table "public"."leaderboards" from "authenticated";

revoke update on table "public"."leaderboards" from "authenticated";

revoke delete on table "public"."leaderboards" from "service_role";

revoke insert on table "public"."leaderboards" from "service_role";

revoke references on table "public"."leaderboards" from "service_role";

revoke select on table "public"."leaderboards" from "service_role";

revoke trigger on table "public"."leaderboards" from "service_role";

revoke truncate on table "public"."leaderboards" from "service_role";

revoke update on table "public"."leaderboards" from "service_role";

revoke delete on table "public"."match_gates" from "anon";

revoke insert on table "public"."match_gates" from "anon";

revoke references on table "public"."match_gates" from "anon";

revoke select on table "public"."match_gates" from "anon";

revoke trigger on table "public"."match_gates" from "anon";

revoke truncate on table "public"."match_gates" from "anon";

revoke update on table "public"."match_gates" from "anon";

revoke delete on table "public"."match_gates" from "authenticated";

revoke insert on table "public"."match_gates" from "authenticated";

revoke references on table "public"."match_gates" from "authenticated";

revoke select on table "public"."match_gates" from "authenticated";

revoke trigger on table "public"."match_gates" from "authenticated";

revoke truncate on table "public"."match_gates" from "authenticated";

revoke update on table "public"."match_gates" from "authenticated";

revoke delete on table "public"."match_gates" from "service_role";

revoke insert on table "public"."match_gates" from "service_role";

revoke references on table "public"."match_gates" from "service_role";

revoke select on table "public"."match_gates" from "service_role";

revoke trigger on table "public"."match_gates" from "service_role";

revoke truncate on table "public"."match_gates" from "service_role";

revoke update on table "public"."match_gates" from "service_role";

revoke delete on table "public"."match_zones" from "anon";

revoke insert on table "public"."match_zones" from "anon";

revoke references on table "public"."match_zones" from "anon";

revoke select on table "public"."match_zones" from "anon";

revoke trigger on table "public"."match_zones" from "anon";

revoke truncate on table "public"."match_zones" from "anon";

revoke update on table "public"."match_zones" from "anon";

revoke delete on table "public"."match_zones" from "authenticated";

revoke insert on table "public"."match_zones" from "authenticated";

revoke references on table "public"."match_zones" from "authenticated";

revoke select on table "public"."match_zones" from "authenticated";

revoke trigger on table "public"."match_zones" from "authenticated";

revoke truncate on table "public"."match_zones" from "authenticated";

revoke update on table "public"."match_zones" from "authenticated";

revoke delete on table "public"."match_zones" from "service_role";

revoke insert on table "public"."match_zones" from "service_role";

revoke references on table "public"."match_zones" from "service_role";

revoke select on table "public"."match_zones" from "service_role";

revoke trigger on table "public"."match_zones" from "service_role";

revoke truncate on table "public"."match_zones" from "service_role";

revoke update on table "public"."match_zones" from "service_role";

revoke delete on table "public"."matches" from "anon";

revoke insert on table "public"."matches" from "anon";

revoke references on table "public"."matches" from "anon";

revoke select on table "public"."matches" from "anon";

revoke trigger on table "public"."matches" from "anon";

revoke truncate on table "public"."matches" from "anon";

revoke update on table "public"."matches" from "anon";

revoke delete on table "public"."matches" from "authenticated";

revoke insert on table "public"."matches" from "authenticated";

revoke references on table "public"."matches" from "authenticated";

revoke select on table "public"."matches" from "authenticated";

revoke trigger on table "public"."matches" from "authenticated";

revoke truncate on table "public"."matches" from "authenticated";

revoke update on table "public"."matches" from "authenticated";

revoke delete on table "public"."matches" from "service_role";

revoke insert on table "public"."matches" from "service_role";

revoke references on table "public"."matches" from "service_role";

revoke select on table "public"."matches" from "service_role";

revoke trigger on table "public"."matches" from "service_role";

revoke truncate on table "public"."matches" from "service_role";

revoke update on table "public"."matches" from "service_role";

revoke delete on table "public"."membership_plans" from "anon";

revoke insert on table "public"."membership_plans" from "anon";

revoke references on table "public"."membership_plans" from "anon";

revoke select on table "public"."membership_plans" from "anon";

revoke trigger on table "public"."membership_plans" from "anon";

revoke truncate on table "public"."membership_plans" from "anon";

revoke update on table "public"."membership_plans" from "anon";

revoke delete on table "public"."membership_plans" from "authenticated";

revoke insert on table "public"."membership_plans" from "authenticated";

revoke references on table "public"."membership_plans" from "authenticated";

revoke select on table "public"."membership_plans" from "authenticated";

revoke trigger on table "public"."membership_plans" from "authenticated";

revoke truncate on table "public"."membership_plans" from "authenticated";

revoke update on table "public"."membership_plans" from "authenticated";

revoke delete on table "public"."membership_plans" from "service_role";

revoke insert on table "public"."membership_plans" from "service_role";

revoke references on table "public"."membership_plans" from "service_role";

revoke select on table "public"."membership_plans" from "service_role";

revoke trigger on table "public"."membership_plans" from "service_role";

revoke truncate on table "public"."membership_plans" from "service_role";

revoke update on table "public"."membership_plans" from "service_role";

revoke delete on table "public"."memberships" from "anon";

revoke insert on table "public"."memberships" from "anon";

revoke references on table "public"."memberships" from "anon";

revoke select on table "public"."memberships" from "anon";

revoke trigger on table "public"."memberships" from "anon";

revoke truncate on table "public"."memberships" from "anon";

revoke update on table "public"."memberships" from "anon";

revoke delete on table "public"."memberships" from "authenticated";

revoke insert on table "public"."memberships" from "authenticated";

revoke references on table "public"."memberships" from "authenticated";

revoke select on table "public"."memberships" from "authenticated";

revoke trigger on table "public"."memberships" from "authenticated";

revoke truncate on table "public"."memberships" from "authenticated";

revoke update on table "public"."memberships" from "authenticated";

revoke delete on table "public"."memberships" from "service_role";

revoke insert on table "public"."memberships" from "service_role";

revoke references on table "public"."memberships" from "service_role";

revoke select on table "public"."memberships" from "service_role";

revoke trigger on table "public"."memberships" from "service_role";

revoke truncate on table "public"."memberships" from "service_role";

revoke update on table "public"."memberships" from "service_role";

revoke delete on table "public"."order_items" from "anon";

revoke insert on table "public"."order_items" from "anon";

revoke references on table "public"."order_items" from "anon";

revoke select on table "public"."order_items" from "anon";

revoke trigger on table "public"."order_items" from "anon";

revoke truncate on table "public"."order_items" from "anon";

revoke update on table "public"."order_items" from "anon";

revoke delete on table "public"."order_items" from "authenticated";

revoke insert on table "public"."order_items" from "authenticated";

revoke references on table "public"."order_items" from "authenticated";

revoke select on table "public"."order_items" from "authenticated";

revoke trigger on table "public"."order_items" from "authenticated";

revoke truncate on table "public"."order_items" from "authenticated";

revoke update on table "public"."order_items" from "authenticated";

revoke delete on table "public"."order_items" from "service_role";

revoke insert on table "public"."order_items" from "service_role";

revoke references on table "public"."order_items" from "service_role";

revoke select on table "public"."order_items" from "service_role";

revoke trigger on table "public"."order_items" from "service_role";

revoke truncate on table "public"."order_items" from "service_role";

revoke update on table "public"."order_items" from "service_role";

revoke delete on table "public"."orders" from "anon";

revoke insert on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "anon";

revoke select on table "public"."orders" from "anon";

revoke trigger on table "public"."orders" from "anon";

revoke truncate on table "public"."orders" from "anon";

revoke update on table "public"."orders" from "anon";

revoke delete on table "public"."orders" from "authenticated";

revoke insert on table "public"."orders" from "authenticated";

revoke references on table "public"."orders" from "authenticated";

revoke select on table "public"."orders" from "authenticated";

revoke trigger on table "public"."orders" from "authenticated";

revoke truncate on table "public"."orders" from "authenticated";

revoke update on table "public"."orders" from "authenticated";

revoke delete on table "public"."orders" from "service_role";

revoke insert on table "public"."orders" from "service_role";

revoke references on table "public"."orders" from "service_role";

revoke select on table "public"."orders" from "service_role";

revoke trigger on table "public"."orders" from "service_role";

revoke truncate on table "public"."orders" from "service_role";

revoke update on table "public"."orders" from "service_role";

revoke delete on table "public"."partners" from "anon";

revoke insert on table "public"."partners" from "anon";

revoke references on table "public"."partners" from "anon";

revoke select on table "public"."partners" from "anon";

revoke trigger on table "public"."partners" from "anon";

revoke truncate on table "public"."partners" from "anon";

revoke update on table "public"."partners" from "anon";

revoke delete on table "public"."partners" from "authenticated";

revoke insert on table "public"."partners" from "authenticated";

revoke references on table "public"."partners" from "authenticated";

revoke select on table "public"."partners" from "authenticated";

revoke trigger on table "public"."partners" from "authenticated";

revoke truncate on table "public"."partners" from "authenticated";

revoke update on table "public"."partners" from "authenticated";

revoke delete on table "public"."partners" from "service_role";

revoke insert on table "public"."partners" from "service_role";

revoke references on table "public"."partners" from "service_role";

revoke select on table "public"."partners" from "service_role";

revoke trigger on table "public"."partners" from "service_role";

revoke truncate on table "public"."partners" from "service_role";

revoke update on table "public"."partners" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."permissions" from "anon";

revoke insert on table "public"."permissions" from "anon";

revoke references on table "public"."permissions" from "anon";

revoke select on table "public"."permissions" from "anon";

revoke trigger on table "public"."permissions" from "anon";

revoke truncate on table "public"."permissions" from "anon";

revoke update on table "public"."permissions" from "anon";

revoke delete on table "public"."permissions" from "authenticated";

revoke insert on table "public"."permissions" from "authenticated";

revoke references on table "public"."permissions" from "authenticated";

revoke select on table "public"."permissions" from "authenticated";

revoke trigger on table "public"."permissions" from "authenticated";

revoke truncate on table "public"."permissions" from "authenticated";

revoke update on table "public"."permissions" from "authenticated";

revoke delete on table "public"."permissions" from "service_role";

revoke insert on table "public"."permissions" from "service_role";

revoke references on table "public"."permissions" from "service_role";

revoke select on table "public"."permissions" from "service_role";

revoke trigger on table "public"."permissions" from "service_role";

revoke truncate on table "public"."permissions" from "service_role";

revoke update on table "public"."permissions" from "service_role";

revoke delete on table "public"."policies" from "anon";

revoke insert on table "public"."policies" from "anon";

revoke references on table "public"."policies" from "anon";

revoke select on table "public"."policies" from "anon";

revoke trigger on table "public"."policies" from "anon";

revoke truncate on table "public"."policies" from "anon";

revoke update on table "public"."policies" from "anon";

revoke delete on table "public"."policies" from "authenticated";

revoke insert on table "public"."policies" from "authenticated";

revoke references on table "public"."policies" from "authenticated";

revoke select on table "public"."policies" from "authenticated";

revoke trigger on table "public"."policies" from "authenticated";

revoke truncate on table "public"."policies" from "authenticated";

revoke update on table "public"."policies" from "authenticated";

revoke delete on table "public"."policies" from "service_role";

revoke insert on table "public"."policies" from "service_role";

revoke references on table "public"."policies" from "service_role";

revoke select on table "public"."policies" from "service_role";

revoke trigger on table "public"."policies" from "service_role";

revoke truncate on table "public"."policies" from "service_role";

revoke update on table "public"."policies" from "service_role";

revoke delete on table "public"."polls" from "anon";

revoke insert on table "public"."polls" from "anon";

revoke references on table "public"."polls" from "anon";

revoke select on table "public"."polls" from "anon";

revoke trigger on table "public"."polls" from "anon";

revoke truncate on table "public"."polls" from "anon";

revoke update on table "public"."polls" from "anon";

revoke delete on table "public"."polls" from "authenticated";

revoke insert on table "public"."polls" from "authenticated";

revoke references on table "public"."polls" from "authenticated";

revoke select on table "public"."polls" from "authenticated";

revoke trigger on table "public"."polls" from "authenticated";

revoke truncate on table "public"."polls" from "authenticated";

revoke update on table "public"."polls" from "authenticated";

revoke delete on table "public"."polls" from "service_role";

revoke insert on table "public"."polls" from "service_role";

revoke references on table "public"."polls" from "service_role";

revoke select on table "public"."polls" from "service_role";

revoke trigger on table "public"."polls" from "service_role";

revoke truncate on table "public"."polls" from "service_role";

revoke update on table "public"."polls" from "service_role";

revoke delete on table "public"."report_schedules" from "anon";

revoke insert on table "public"."report_schedules" from "anon";

revoke references on table "public"."report_schedules" from "anon";

revoke select on table "public"."report_schedules" from "anon";

revoke trigger on table "public"."report_schedules" from "anon";

revoke truncate on table "public"."report_schedules" from "anon";

revoke update on table "public"."report_schedules" from "anon";

revoke delete on table "public"."report_schedules" from "authenticated";

revoke insert on table "public"."report_schedules" from "authenticated";

revoke references on table "public"."report_schedules" from "authenticated";

revoke select on table "public"."report_schedules" from "authenticated";

revoke trigger on table "public"."report_schedules" from "authenticated";

revoke truncate on table "public"."report_schedules" from "authenticated";

revoke update on table "public"."report_schedules" from "authenticated";

revoke delete on table "public"."report_schedules" from "service_role";

revoke insert on table "public"."report_schedules" from "service_role";

revoke references on table "public"."report_schedules" from "service_role";

revoke select on table "public"."report_schedules" from "service_role";

revoke trigger on table "public"."report_schedules" from "service_role";

revoke truncate on table "public"."report_schedules" from "service_role";

revoke update on table "public"."report_schedules" from "service_role";

revoke delete on table "public"."rewards_events" from "anon";

revoke insert on table "public"."rewards_events" from "anon";

revoke references on table "public"."rewards_events" from "anon";

revoke select on table "public"."rewards_events" from "anon";

revoke trigger on table "public"."rewards_events" from "anon";

revoke truncate on table "public"."rewards_events" from "anon";

revoke update on table "public"."rewards_events" from "anon";

revoke delete on table "public"."rewards_events" from "authenticated";

revoke insert on table "public"."rewards_events" from "authenticated";

revoke references on table "public"."rewards_events" from "authenticated";

revoke select on table "public"."rewards_events" from "authenticated";

revoke trigger on table "public"."rewards_events" from "authenticated";

revoke truncate on table "public"."rewards_events" from "authenticated";

revoke update on table "public"."rewards_events" from "authenticated";

revoke delete on table "public"."rewards_events" from "service_role";

revoke insert on table "public"."rewards_events" from "service_role";

revoke references on table "public"."rewards_events" from "service_role";

revoke select on table "public"."rewards_events" from "service_role";

revoke trigger on table "public"."rewards_events" from "service_role";

revoke truncate on table "public"."rewards_events" from "service_role";

revoke update on table "public"."rewards_events" from "service_role";

revoke delete on table "public"."roles_permissions" from "anon";

revoke insert on table "public"."roles_permissions" from "anon";

revoke references on table "public"."roles_permissions" from "anon";

revoke select on table "public"."roles_permissions" from "anon";

revoke trigger on table "public"."roles_permissions" from "anon";

revoke truncate on table "public"."roles_permissions" from "anon";

revoke update on table "public"."roles_permissions" from "anon";

revoke delete on table "public"."roles_permissions" from "authenticated";

revoke insert on table "public"."roles_permissions" from "authenticated";

revoke references on table "public"."roles_permissions" from "authenticated";

revoke select on table "public"."roles_permissions" from "authenticated";

revoke trigger on table "public"."roles_permissions" from "authenticated";

revoke truncate on table "public"."roles_permissions" from "authenticated";

revoke update on table "public"."roles_permissions" from "authenticated";

revoke delete on table "public"."roles_permissions" from "service_role";

revoke insert on table "public"."roles_permissions" from "service_role";

revoke references on table "public"."roles_permissions" from "service_role";

revoke select on table "public"."roles_permissions" from "service_role";

revoke trigger on table "public"."roles_permissions" from "service_role";

revoke truncate on table "public"."roles_permissions" from "service_role";

revoke update on table "public"."roles_permissions" from "service_role";

revoke delete on table "public"."sacco_deposits" from "anon";

revoke insert on table "public"."sacco_deposits" from "anon";

revoke references on table "public"."sacco_deposits" from "anon";

revoke select on table "public"."sacco_deposits" from "anon";

revoke trigger on table "public"."sacco_deposits" from "anon";

revoke truncate on table "public"."sacco_deposits" from "anon";

revoke update on table "public"."sacco_deposits" from "anon";

revoke delete on table "public"."sacco_deposits" from "authenticated";

revoke insert on table "public"."sacco_deposits" from "authenticated";

revoke references on table "public"."sacco_deposits" from "authenticated";

revoke select on table "public"."sacco_deposits" from "authenticated";

revoke trigger on table "public"."sacco_deposits" from "authenticated";

revoke truncate on table "public"."sacco_deposits" from "authenticated";

revoke update on table "public"."sacco_deposits" from "authenticated";

revoke delete on table "public"."sacco_deposits" from "service_role";

revoke insert on table "public"."sacco_deposits" from "service_role";

revoke references on table "public"."sacco_deposits" from "service_role";

revoke select on table "public"."sacco_deposits" from "service_role";

revoke trigger on table "public"."sacco_deposits" from "service_role";

revoke truncate on table "public"."sacco_deposits" from "service_role";

revoke update on table "public"."sacco_deposits" from "service_role";

revoke delete on table "public"."shop_products" from "anon";

revoke insert on table "public"."shop_products" from "anon";

revoke references on table "public"."shop_products" from "anon";

revoke select on table "public"."shop_products" from "anon";

revoke trigger on table "public"."shop_products" from "anon";

revoke truncate on table "public"."shop_products" from "anon";

revoke update on table "public"."shop_products" from "anon";

revoke delete on table "public"."shop_products" from "authenticated";

revoke insert on table "public"."shop_products" from "authenticated";

revoke references on table "public"."shop_products" from "authenticated";

revoke select on table "public"."shop_products" from "authenticated";

revoke trigger on table "public"."shop_products" from "authenticated";

revoke truncate on table "public"."shop_products" from "authenticated";

revoke update on table "public"."shop_products" from "authenticated";

revoke delete on table "public"."shop_products" from "service_role";

revoke insert on table "public"."shop_products" from "service_role";

revoke references on table "public"."shop_products" from "service_role";

revoke select on table "public"."shop_products" from "service_role";

revoke trigger on table "public"."shop_products" from "service_role";

revoke truncate on table "public"."shop_products" from "service_role";

revoke update on table "public"."shop_products" from "service_role";

revoke delete on table "public"."shop_promotions" from "anon";

revoke insert on table "public"."shop_promotions" from "anon";

revoke references on table "public"."shop_promotions" from "anon";

revoke select on table "public"."shop_promotions" from "anon";

revoke trigger on table "public"."shop_promotions" from "anon";

revoke truncate on table "public"."shop_promotions" from "anon";

revoke update on table "public"."shop_promotions" from "anon";

revoke delete on table "public"."shop_promotions" from "authenticated";

revoke insert on table "public"."shop_promotions" from "authenticated";

revoke references on table "public"."shop_promotions" from "authenticated";

revoke select on table "public"."shop_promotions" from "authenticated";

revoke trigger on table "public"."shop_promotions" from "authenticated";

revoke truncate on table "public"."shop_promotions" from "authenticated";

revoke update on table "public"."shop_promotions" from "authenticated";

revoke delete on table "public"."shop_promotions" from "service_role";

revoke insert on table "public"."shop_promotions" from "service_role";

revoke references on table "public"."shop_promotions" from "service_role";

revoke select on table "public"."shop_promotions" from "service_role";

revoke trigger on table "public"."shop_promotions" from "service_role";

revoke truncate on table "public"."shop_promotions" from "service_role";

revoke update on table "public"."shop_promotions" from "service_role";

revoke delete on table "public"."sms_parsed" from "anon";

revoke insert on table "public"."sms_parsed" from "anon";

revoke references on table "public"."sms_parsed" from "anon";

revoke select on table "public"."sms_parsed" from "anon";

revoke trigger on table "public"."sms_parsed" from "anon";

revoke truncate on table "public"."sms_parsed" from "anon";

revoke update on table "public"."sms_parsed" from "anon";

revoke delete on table "public"."sms_parsed" from "authenticated";

revoke insert on table "public"."sms_parsed" from "authenticated";

revoke references on table "public"."sms_parsed" from "authenticated";

revoke select on table "public"."sms_parsed" from "authenticated";

revoke trigger on table "public"."sms_parsed" from "authenticated";

revoke truncate on table "public"."sms_parsed" from "authenticated";

revoke update on table "public"."sms_parsed" from "authenticated";

revoke delete on table "public"."sms_parsed" from "service_role";

revoke insert on table "public"."sms_parsed" from "service_role";

revoke references on table "public"."sms_parsed" from "service_role";

revoke select on table "public"."sms_parsed" from "service_role";

revoke trigger on table "public"."sms_parsed" from "service_role";

revoke truncate on table "public"."sms_parsed" from "service_role";

revoke update on table "public"."sms_parsed" from "service_role";

revoke delete on table "public"."sms_raw" from "anon";

revoke insert on table "public"."sms_raw" from "anon";

revoke references on table "public"."sms_raw" from "anon";

revoke select on table "public"."sms_raw" from "anon";

revoke trigger on table "public"."sms_raw" from "anon";

revoke truncate on table "public"."sms_raw" from "anon";

revoke update on table "public"."sms_raw" from "anon";

revoke delete on table "public"."sms_raw" from "authenticated";

revoke insert on table "public"."sms_raw" from "authenticated";

revoke references on table "public"."sms_raw" from "authenticated";

revoke select on table "public"."sms_raw" from "authenticated";

revoke trigger on table "public"."sms_raw" from "authenticated";

revoke truncate on table "public"."sms_raw" from "authenticated";

revoke update on table "public"."sms_raw" from "authenticated";

revoke delete on table "public"."sms_raw" from "service_role";

revoke insert on table "public"."sms_raw" from "service_role";

revoke references on table "public"."sms_raw" from "service_role";

revoke select on table "public"."sms_raw" from "service_role";

revoke trigger on table "public"."sms_raw" from "service_role";

revoke truncate on table "public"."sms_raw" from "service_role";

revoke update on table "public"."sms_raw" from "service_role";

revoke delete on table "public"."ticket_order_items" from "anon";

revoke insert on table "public"."ticket_order_items" from "anon";

revoke references on table "public"."ticket_order_items" from "anon";

revoke select on table "public"."ticket_order_items" from "anon";

revoke trigger on table "public"."ticket_order_items" from "anon";

revoke truncate on table "public"."ticket_order_items" from "anon";

revoke update on table "public"."ticket_order_items" from "anon";

revoke delete on table "public"."ticket_order_items" from "authenticated";

revoke insert on table "public"."ticket_order_items" from "authenticated";

revoke references on table "public"."ticket_order_items" from "authenticated";

revoke select on table "public"."ticket_order_items" from "authenticated";

revoke trigger on table "public"."ticket_order_items" from "authenticated";

revoke truncate on table "public"."ticket_order_items" from "authenticated";

revoke update on table "public"."ticket_order_items" from "authenticated";

revoke delete on table "public"."ticket_order_items" from "service_role";

revoke insert on table "public"."ticket_order_items" from "service_role";

revoke references on table "public"."ticket_order_items" from "service_role";

revoke select on table "public"."ticket_order_items" from "service_role";

revoke trigger on table "public"."ticket_order_items" from "service_role";

revoke truncate on table "public"."ticket_order_items" from "service_role";

revoke update on table "public"."ticket_order_items" from "service_role";

revoke delete on table "public"."ticket_orders" from "anon";

revoke insert on table "public"."ticket_orders" from "anon";

revoke references on table "public"."ticket_orders" from "anon";

revoke select on table "public"."ticket_orders" from "anon";

revoke trigger on table "public"."ticket_orders" from "anon";

revoke truncate on table "public"."ticket_orders" from "anon";

revoke update on table "public"."ticket_orders" from "anon";

revoke delete on table "public"."ticket_orders" from "authenticated";

revoke insert on table "public"."ticket_orders" from "authenticated";

revoke references on table "public"."ticket_orders" from "authenticated";

revoke select on table "public"."ticket_orders" from "authenticated";

revoke trigger on table "public"."ticket_orders" from "authenticated";

revoke truncate on table "public"."ticket_orders" from "authenticated";

revoke update on table "public"."ticket_orders" from "authenticated";

revoke delete on table "public"."ticket_orders" from "service_role";

revoke insert on table "public"."ticket_orders" from "service_role";

revoke references on table "public"."ticket_orders" from "service_role";

revoke select on table "public"."ticket_orders" from "service_role";

revoke trigger on table "public"."ticket_orders" from "service_role";

revoke truncate on table "public"."ticket_orders" from "service_role";

revoke update on table "public"."ticket_orders" from "service_role";

revoke delete on table "public"."ticket_passes" from "anon";

revoke insert on table "public"."ticket_passes" from "anon";

revoke references on table "public"."ticket_passes" from "anon";

revoke select on table "public"."ticket_passes" from "anon";

revoke trigger on table "public"."ticket_passes" from "anon";

revoke truncate on table "public"."ticket_passes" from "anon";

revoke update on table "public"."ticket_passes" from "anon";

revoke delete on table "public"."ticket_passes" from "authenticated";

revoke insert on table "public"."ticket_passes" from "authenticated";

revoke references on table "public"."ticket_passes" from "authenticated";

revoke select on table "public"."ticket_passes" from "authenticated";

revoke trigger on table "public"."ticket_passes" from "authenticated";

revoke truncate on table "public"."ticket_passes" from "authenticated";

revoke update on table "public"."ticket_passes" from "authenticated";

revoke delete on table "public"."ticket_passes" from "service_role";

revoke insert on table "public"."ticket_passes" from "service_role";

revoke references on table "public"."ticket_passes" from "service_role";

revoke select on table "public"."ticket_passes" from "service_role";

revoke trigger on table "public"."ticket_passes" from "service_role";

revoke truncate on table "public"."ticket_passes" from "service_role";

revoke update on table "public"."ticket_passes" from "service_role";

revoke delete on table "public"."transactions" from "anon";

revoke insert on table "public"."transactions" from "anon";

revoke references on table "public"."transactions" from "anon";

revoke select on table "public"."transactions" from "anon";

revoke trigger on table "public"."transactions" from "anon";

revoke truncate on table "public"."transactions" from "anon";

revoke update on table "public"."transactions" from "anon";

revoke delete on table "public"."transactions" from "authenticated";

revoke insert on table "public"."transactions" from "authenticated";

revoke references on table "public"."transactions" from "authenticated";

revoke select on table "public"."transactions" from "authenticated";

revoke trigger on table "public"."transactions" from "authenticated";

revoke truncate on table "public"."transactions" from "authenticated";

revoke update on table "public"."transactions" from "authenticated";

revoke delete on table "public"."transactions" from "service_role";

revoke insert on table "public"."transactions" from "service_role";

revoke references on table "public"."transactions" from "service_role";

revoke select on table "public"."transactions" from "service_role";

revoke trigger on table "public"."transactions" from "service_role";

revoke truncate on table "public"."transactions" from "service_role";

revoke update on table "public"."transactions" from "service_role";

revoke delete on table "public"."translations" from "anon";

revoke insert on table "public"."translations" from "anon";

revoke references on table "public"."translations" from "anon";

revoke select on table "public"."translations" from "anon";

revoke trigger on table "public"."translations" from "anon";

revoke truncate on table "public"."translations" from "anon";

revoke update on table "public"."translations" from "anon";

revoke delete on table "public"."translations" from "authenticated";

revoke insert on table "public"."translations" from "authenticated";

revoke references on table "public"."translations" from "authenticated";

revoke select on table "public"."translations" from "authenticated";

revoke trigger on table "public"."translations" from "authenticated";

revoke truncate on table "public"."translations" from "authenticated";

revoke update on table "public"."translations" from "authenticated";

revoke delete on table "public"."translations" from "service_role";

revoke insert on table "public"."translations" from "service_role";

revoke references on table "public"."translations" from "service_role";

revoke select on table "public"."translations" from "service_role";

revoke trigger on table "public"."translations" from "service_role";

revoke truncate on table "public"."translations" from "service_role";

revoke update on table "public"."translations" from "service_role";

revoke delete on table "public"."user_favorites" from "anon";

revoke insert on table "public"."user_favorites" from "anon";

revoke references on table "public"."user_favorites" from "anon";

revoke select on table "public"."user_favorites" from "anon";

revoke trigger on table "public"."user_favorites" from "anon";

revoke truncate on table "public"."user_favorites" from "anon";

revoke update on table "public"."user_favorites" from "anon";

revoke delete on table "public"."user_favorites" from "authenticated";

revoke insert on table "public"."user_favorites" from "authenticated";

revoke references on table "public"."user_favorites" from "authenticated";

revoke select on table "public"."user_favorites" from "authenticated";

revoke trigger on table "public"."user_favorites" from "authenticated";

revoke truncate on table "public"."user_favorites" from "authenticated";

revoke update on table "public"."user_favorites" from "authenticated";

revoke delete on table "public"."user_favorites" from "service_role";

revoke insert on table "public"."user_favorites" from "service_role";

revoke references on table "public"."user_favorites" from "service_role";

revoke select on table "public"."user_favorites" from "service_role";

revoke trigger on table "public"."user_favorites" from "service_role";

revoke truncate on table "public"."user_favorites" from "service_role";

revoke update on table "public"."user_favorites" from "service_role";

revoke delete on table "public"."user_prefs" from "anon";

revoke insert on table "public"."user_prefs" from "anon";

revoke references on table "public"."user_prefs" from "anon";

revoke select on table "public"."user_prefs" from "anon";

revoke trigger on table "public"."user_prefs" from "anon";

revoke truncate on table "public"."user_prefs" from "anon";

revoke update on table "public"."user_prefs" from "anon";

revoke delete on table "public"."user_prefs" from "authenticated";

revoke insert on table "public"."user_prefs" from "authenticated";

revoke references on table "public"."user_prefs" from "authenticated";

revoke select on table "public"."user_prefs" from "authenticated";

revoke trigger on table "public"."user_prefs" from "authenticated";

revoke truncate on table "public"."user_prefs" from "authenticated";

revoke update on table "public"."user_prefs" from "authenticated";

revoke delete on table "public"."user_prefs" from "service_role";

revoke insert on table "public"."user_prefs" from "service_role";

revoke references on table "public"."user_prefs" from "service_role";

revoke select on table "public"."user_prefs" from "service_role";

revoke trigger on table "public"."user_prefs" from "service_role";

revoke truncate on table "public"."user_prefs" from "service_role";

revoke update on table "public"."user_prefs" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."wallet" from "anon";

revoke insert on table "public"."wallet" from "anon";

revoke references on table "public"."wallet" from "anon";

revoke select on table "public"."wallet" from "anon";

revoke trigger on table "public"."wallet" from "anon";

revoke truncate on table "public"."wallet" from "anon";

revoke update on table "public"."wallet" from "anon";

revoke delete on table "public"."wallet" from "authenticated";

revoke insert on table "public"."wallet" from "authenticated";

revoke references on table "public"."wallet" from "authenticated";

revoke select on table "public"."wallet" from "authenticated";

revoke trigger on table "public"."wallet" from "authenticated";

revoke truncate on table "public"."wallet" from "authenticated";

revoke update on table "public"."wallet" from "authenticated";

revoke delete on table "public"."wallet" from "service_role";

revoke insert on table "public"."wallet" from "service_role";

revoke references on table "public"."wallet" from "service_role";

revoke select on table "public"."wallet" from "service_role";

revoke trigger on table "public"."wallet" from "service_role";

revoke truncate on table "public"."wallet" from "service_role";

revoke update on table "public"."wallet" from "service_role";

alter table "public"."transactions" drop constraint "transactions_user_id_fkey";

drop view if exists "public"."admin_community_rate_limits";

drop view if exists "public"."public_content";

drop view if exists "public"."public_members";

alter table "public"."transactions" drop constraint "transactions_pkey";

drop index if exists "public"."idx_ticket_orders_status";

drop index if exists "public"."transactions_pkey";

create table "public"."_prisma_migrations" (
    "id" character varying(36) not null,
    "checksum" character varying(64) not null,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) not null,
    "logs" text,
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone not null default now(),
    "applied_steps_count" integer not null default 0
);


alter table "public"."_prisma_migrations" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "price" integer,
    "stock" integer default 0,
    "images" jsonb default '[]'::jsonb
);


alter table "public"."products" enable row level security;

create table "public"."tickets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "match_id" uuid,
    "zone" text not null,
    "price" integer not null,
    "paid" boolean default false,
    "momo_ref" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."tickets" enable row level security;

alter table "public"."community_posts" drop column "body";

alter table "public"."community_posts" drop column "evidence";

alter table "public"."community_posts" drop column "media";

alter table "public"."community_posts" drop column "moderator_notes";

alter table "public"."community_posts" drop column "updated_at";

alter table "public"."community_posts" add column "media_url" text;

alter table "public"."community_posts" add column "text" text;

alter table "public"."community_posts" alter column "status" set default 'visible'::text;

alter table "public"."community_posts" alter column "status" drop not null;

alter table "public"."content_items" drop column "updated_at";

alter table "public"."content_items" add column "kind" text not null;

alter table "public"."content_items" add column "media_url" text;

alter table "public"."content_items" add column "summary" text;

alter table "public"."content_items" add column "tags" text[] default '{}'::text[];

alter table "public"."content_items" alter column "body" drop default;

alter table "public"."content_items" alter column "body" set data type text using "body"::text;

alter table "public"."content_items" alter column "status" drop not null;

alter table "public"."content_items" alter column "type" drop not null;

alter table "public"."feature_flags" alter column "enabled" set not null;

alter table "public"."transactions" drop column "status";

alter table "public"."transactions" drop column "type";

alter table "public"."transactions" add column "kind" text;

alter table "public"."transactions" alter column "created_at" drop not null;

alter table "public"."users" add column "user_code" text;

alter table "public"."users" alter column "public_profile" set default false;

alter table "public"."users" alter column "public_profile" set data type boolean using "public_profile"::boolean;

CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id);

CREATE UNIQUE INDEX products_pkey1 ON public.products USING btree (id);

CREATE UNIQUE INDEX tickets_pkey1 ON public.tickets USING btree (id);

CREATE UNIQUE INDEX transactions_pkey1 ON public.transactions USING btree (id);

CREATE UNIQUE INDEX users_user_code_key ON public.users USING btree (user_code) WHERE (user_code IS NOT NULL);

alter table "public"."_prisma_migrations" add constraint "_prisma_migrations_pkey" PRIMARY KEY using index "_prisma_migrations_pkey";

alter table "public"."products" add constraint "products_pkey1" PRIMARY KEY using index "products_pkey1";

alter table "public"."tickets" add constraint "tickets_pkey1" PRIMARY KEY using index "tickets_pkey1";

alter table "public"."transactions" add constraint "transactions_pkey1" PRIMARY KEY using index "transactions_pkey1";

alter table "public"."community_posts" add constraint "community_posts_status_check" CHECK ((status = ANY (ARRAY['visible'::text, 'hidden'::text]))) not valid;

alter table "public"."community_posts" validate constraint "community_posts_status_check";

alter table "public"."content_items" add constraint "content_items_kind_check" CHECK ((kind = ANY (ARRAY['article'::text, 'video'::text]))) not valid;

alter table "public"."content_items" validate constraint "content_items_kind_check";

alter table "public"."tickets" add constraint "tickets_match_id_fkey1" FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE not valid;

alter table "public"."tickets" validate constraint "tickets_match_id_fkey1";

alter table "public"."tickets" add constraint "tickets_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_user_id_fkey1";

alter table "public"."tickets" add constraint "tickets_zone_check" CHECK ((zone = ANY (ARRAY['VIP'::text, 'Regular'::text, 'Blue'::text]))) not valid;

alter table "public"."tickets" validate constraint "tickets_zone_check";

alter table "public"."transactions" add constraint "transactions_kind_check" CHECK ((kind = ANY (ARRAY['deposit'::text, 'purchase'::text, 'refund'::text, 'reward'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_kind_check";

alter table "public"."transactions" add constraint "transactions_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey1";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.award_points_for_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  award integer;
begin
  if (new.status <> 'confirmed') then
    return new;
  end if;
  award := greatest(1, floor(new.amount / 1000));
  if new.user_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    values (new.user_id, 'payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb));
  elsif new.ticket_order_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    select t.user_id, 'ticket_payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb)
    from public.ticket_orders t where t.id = new.ticket_order_id;
  elsif new.order_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    select o.user_id, 'shop_payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb)
    from public.orders o where o.id = new.order_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.award_points_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  add_points int := rewards_points_for(NEW.kind, NEW.amount);
  owning_user uuid;
BEGIN
  IF add_points > 0 THEN
    IF NEW.ticket_order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM ticket_orders WHERE id = NEW.ticket_order_id;
    ELSIF NEW.order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM orders WHERE id = NEW.order_id;
    END IF;
    IF owning_user IS NOT NULL THEN
      UPDATE users SET points = COALESCE(points,0) + add_points WHERE id = owning_user;
      INSERT INTO rewards_events (user_id, source, ref_id, points, meta)
      VALUES (owning_user, 'transaction', NEW.id, add_points, jsonb_build_object('kind', NEW.kind, 'amount', NEW.amount));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id uuid, p_points_delta integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update users
  set points = coalesce(points, 0) + coalesce(p_points_delta, 0)
  where id = p_user_id;
end;
$function$
;

create or replace view "public"."public_content" as  SELECT id,
    title,
    slug,
    kind,
    status,
    published_at,
    created_at
   FROM content_items
  WHERE (status = 'published'::text);


create or replace view "public"."public_members" as  SELECT id,
    COALESCE(display_name, name, 'Fan'::text) AS display_name,
    COALESCE(region, '—'::text) AS region,
    COALESCE(fan_club, '—'::text) AS fan_club,
    joined_at,
    COALESCE(avatar_url, ''::text) AS avatar_url
   FROM users
  WHERE (COALESCE(public_profile, false) IS TRUE);


CREATE OR REPLACE FUNCTION public.retro_issue_points(target_user uuid, points integer, reason text, meta jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  result jsonb;
begin
  if target_user is null then
    raise exception 'target_user required';
  end if;

  insert into public.rewards_events(user_id, source, ref_id, points, meta)
  values (target_user, 'retro_points', reason, points, meta)
  returning jsonb_build_object('id', id, 'points', points, 'created_at', created_at) into result;

  return jsonb_build_object('status', 'ok', 'event', result);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.retro_issue_ticket_perk(target_user uuid, match uuid, note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  order_id uuid;
  pass_id uuid;
begin
  if target_user is null or match is null then
    raise exception 'target_user and match are required';
  end if;

  insert into public.ticket_orders(user_id, match_id, total, status, sms_ref)
  values (target_user, match, 0, 'paid', 'RETRO-PERK')
  returning id into order_id;

  insert into public.ticket_passes(order_id, zone, gate, qr_token_hash)
  values (order_id, 'Blue', 'G3', encode(gen_random_bytes(12), 'hex'))
  returning id into pass_id;

  insert into public.rewards_events(user_id, source, ref_id, points, meta)
  values (target_user, 'ticket_perk', order_id::text, 0, jsonb_build_object('match_id', match, 'note', note));

  return jsonb_build_object('status', 'ok', 'order_id', order_id, 'pass_id', pass_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rewards_points_for(kind text, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF kind = 'deposit' THEN
    RETURN GREATEST(1, ROUND(amount * 0.02));
  ELSIF kind = 'shop' THEN
    RETURN GREATEST(1, ROUND(amount * 0.01));
  ELSE
    RETURN 0;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_ticket_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_wallet_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

create policy "authenticated_all"
on "public"."_prisma_migrations"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "p_service_role_all"
on "public"."products"
as permissive
for all
to public
using ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'service_role'::text))
with check ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'service_role'::text));


create policy "p_service_role_all"
on "public"."tickets"
as permissive
for all
to public
using ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'service_role'::text))
with check ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'service_role'::text));


create policy "community_posts_owner"
on "public"."community_posts"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "p_community_posts_public_read"
on "public"."community_posts"
as permissive
for select
to public
using (((status = 'visible'::text) OR (auth.uid() = user_id)));


create policy "orders_owner"
on "public"."orders"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "sacco_deposits_owner"
on "public"."sacco_deposits"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "ticket_orders_owner"
on "public"."ticket_orders"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "p_users_public_profiles"
on "public"."users"
as permissive
for select
to public
using ((COALESCE(public_profile, false) AND (COALESCE(current_setting('request.jwt.claim.role'::text, true), ''::text) = ANY (ARRAY['anon'::text, 'authenticated'::text]))));




