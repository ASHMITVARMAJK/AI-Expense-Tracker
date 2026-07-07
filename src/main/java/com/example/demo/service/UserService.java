package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User syncUser(String firebaseUid, String email, String name) {
        Optional<User> existingUser = userRepository.findById(firebaseUid);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean updated = false;
            if (email != null && !email.equals(user.getEmail())) {
                user.setEmail(email);
                updated = true;
            }
            if (name != null && !name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }
            if (updated) {
                return userRepository.save(user);
            }
            return user;
        } else {
            User newUser = User.builder()
                    .firebaseUid(firebaseUid)
                    .email(email)
                    .name(name)
                    .build();
            return userRepository.save(newUser);
        }
    }

    public Optional<User> getUserByUid(String firebaseUid) {
        return userRepository.findById(firebaseUid);
    }
}
